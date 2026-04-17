import { computed, nextTick, onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import houseIconUrl from '~/assets/images/icons/house.svg?url'
import houseMultipleIconUrl from '~/assets/images/icons/house_multiple.svg?url'
import {
  CLUSTER_SAFE_AREA_BOTTOM_RATIO,
  CLUSTER_SAFE_AREA_TOP_RATIO,
  CLUSTER_SAFE_AREA_X_RATIO,
  DEFAULT_FRANCE_BOUNDS,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  buildMarkerGroupMeta,
  clamp,
  createClusterMarkerIcon,
  createListingMarkerIcon,
  createListingMarker as createListingMarkerLayer,
  getClusterListingCount,
  getClusterRenderZoomLevel,
  groupListingsByCoordinate,
  normalizeGeolocatedListings,
  setMarkerListingMetadata,
  type LeafletLike,
  type LeafletMarkerLike,
  type ListingMapItem,
  type ListingMarkerGroup,
  type MarkerClusterCountLike,
  type MapViewportInsets,
  type NormalizedListing
} from '~/utils/listingCatalogMap'

type GlobalLeafletContainer = typeof globalThis & { L?: LeafletNamespaceLike }

type LeafletPointLike = { x: number; y: number }

type LeafletFitTarget = {
  center: unknown
  zoom: number
}

type LeafletBoundsLike = {
  intersects: (other: LeafletBoundsLike) => boolean
}

type LeafletMapLike = {
  setView: (center: unknown, zoom: number, options?: Record<string, unknown>) => LeafletMapLike
  invalidateSize: (options: Record<string, unknown>) => void
  zoomIn: (delta?: number) => void
  zoomOut: (delta?: number) => void
  getSize: () => LeafletPointLike
  getZoom: () => number
  getBoundsZoom: (bounds: LeafletBoundsLike) => number
  getMinZoom: () => number
  on: (event: string, handler: (...args: unknown[]) => void, context?: unknown) => LeafletMapLike
  off?: (event: string, handler?: unknown, context?: unknown) => LeafletMapLike
  remove: () => void
  touchZoom?: {
    _zooming?: boolean
  }
  _animatingZoom?: boolean
  _zoom?: number
  _getBoundsCenterZoom: (bounds: LeafletBoundsLike, options?: Record<string, unknown>) => LeafletFitTarget
}

type ClusterLevelLike = {
  _recursivelyRemoveChildrenFromMap: (...args: unknown[]) => void
  _recursivelyAddChildrenToMap: (cluster: unknown, renderZoom: number, bounds: LeafletBoundsLike) => void
}

type ClusterLike = MarkerClusterCountLike & {
  _childClusters: ClusterLike[]
  _zoom: number
  getBounds: () => LeafletBoundsLike
  getLatLng: () => unknown
}

type MarkerClusterLayerLike = {
  addTo: (map: LeafletMapLike) => MarkerClusterLayerLike
  addLayers?: (markers: LeafletMarkerLike[]) => void
  addLayer: (marker: LeafletMarkerLike) => void
  removeLayers?: (markers: LeafletMarkerLike[]) => void
  removeLayer: (marker: LeafletMarkerLike) => void
  on: (event: string, handler: (event: ClusterClickEventLike) => void) => void
  _zoomEnd: () => void
  _moveEnd: () => void
  _getClusterRenderZoom: () => number
  __fractionalZoomPatched?: boolean
  __lastMapZoom?: number
  _map?: LeafletMapLike
  _zoom: number
  _inZoomAnimation?: boolean
  _currentShownBounds: LeafletBoundsLike
  _topClusterLevel: ClusterLevelLike
  _processQueue: () => void
  _animationStart: () => void
  _animationZoomIn: (fromZoom: number, toZoom: number) => void
  _animationZoomOut: (fromZoom: number, toZoom: number) => void
  _getExpandedVisibleBounds: () => LeafletBoundsLike
  _mergeSplitClusters: () => void
}

type ClusterClickEventLike = {
  layer: ClusterLike
}

type LeafletNamespaceLike = LeafletLike & {
  map: (container: HTMLElement, options: Record<string, unknown>) => LeafletMapLike
  tileLayer: (urlTemplate: string, options: Record<string, unknown>) => { addTo: (map: LeafletMapLike) => unknown }
  point: (x: number, y: number) => unknown
  latLngBounds: (bounds: [[number, number], [number, number]]) => LeafletBoundsLike
  markerClusterGroup?: (options: Record<string, unknown>) => MarkerClusterLayerLike
}

type LeafletModuleLike = LeafletNamespaceLike & {
  default?: LeafletNamespaceLike
}

type LayerWithIcon = {
  _icon?: HTMLElement | null
}

interface UseListingCatalogMapOptions {
  active: Ref<boolean>
  listings: Ref<ListingMapItem[]>
  mapContainer: Ref<HTMLElement | null>
  viewportInsets: Ref<MapViewportInsets>
}

const leafletGlobal = globalThis as GlobalLeafletContainer
const LISTING_RESTORE_OPACITY_DELAY_MS = 220
const OPACITY_RETRY_DELAY_MS = 34
const OPACITY_MAX_ATTEMPTS = 24

export function useListingCatalogMap({
  active,
  listings,
  mapContainer,
  viewportInsets
}: UseListingCatalogMapOptions) {
  const router = useRouter()
  const route = useRoute()

  let leaflet: LeafletNamespaceLike | null = null
  let map: LeafletMapLike | null = null
  let markerClusterLayer: MarkerClusterLayerLike | null = null
  let resizeObserver: ResizeObserver | null = null
  let renderAnimationFrame = 0
  let componentDisposed = false
  let movePanThrottle: number | null = null
  let originalGlobalLeaflet: LeafletNamespaceLike | undefined = undefined
  let hadGlobalLeaflet = false

  const markerById = new Map<string, LeafletMarkerLike>()
  const markerMetaById = new Map<string, string>()

  let hasUserAdjustedMapView = false
  let isApplyingInitialMapView = false
  let lastInitialMapViewportKey = ''

  const geolocatedListings = computed<NormalizedListing[]>(() => {
    return normalizeGeolocatedListings(listings.value)
  })

  const geolocatedListingGroups = computed<ListingMarkerGroup[]>(() => {
    return groupListingsByCoordinate(geolocatedListings.value)
  })

  function getListingSlugFromHash(hash: string) {
    const rawHash = hash.startsWith('#') ? hash.slice(1) : hash
    if (!rawHash) return null

    const hashParams = new URLSearchParams(rawHash)
    const listingSlug = hashParams.get('listing')
    return listingSlug ? String(listingSlug) : null
  }

  const activeListingSlug = computed(() => getListingSlugFromHash(route.hash))

  function getRootCssNumberVariable(name: string, fallback: number) {
    if (typeof window === 'undefined') {
      return fallback
    }

    const rawValue = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    const parsed = Number.parseFloat(rawValue)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  function getCatalogOverlayMapActiveOpacity() {
    const opacity = getRootCssNumberVariable('--catalog-overlay-map-active-opacity', 0)
    return Math.min(Math.max(opacity, 0), 1)
  }

  function openListingFromSlug(slug: string) {
    if (!slug) return

    void router.push({
      path: '/gardens',
      hash: `#listing=${encodeURIComponent(slug)}`
    })
  }

  function getListingChipSlugFromTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
      return null
    }

    const chipElement = target.closest('.catalog-map-marker-chip[data-listing-slug]') as HTMLElement | null
    if (!chipElement) {
      return null
    }

    const listingSlug = chipElement.getAttribute('data-listing-slug')
    return listingSlug ? String(listingSlug) : null
  }

  function handleMapChipClick(event: MouseEvent) {
    const listingSlug = getListingChipSlugFromTarget(event.target)
    if (!listingSlug) {
      return
    }

    event.preventDefault()
    event.stopImmediatePropagation()
    event.stopPropagation()
    openListingFromSlug(listingSlug)
  }

  function getLayerIconElement(layer: LayerWithIcon | null) {
    return layer?._icon as HTMLElement | null
  }

  function getMarkerChipElementForSlug(marker: LeafletMarkerLike, slug: string) {
    const iconElement = getLayerIconElement(marker)
    if (!iconElement) return null

    const chipElements = iconElement.querySelectorAll('.catalog-map-marker-chip[data-listing-slug]')
    for (const chipElement of Array.from(chipElements)) {
      if (chipElement instanceof HTMLElement && chipElement.getAttribute('data-listing-slug') === slug) {
        return chipElement
      }
    }

    return null
  }

  function scheduleOpacityAttempt(
    runAttempt: (attemptsLeft: number) => boolean,
    initialDelayMs = 0,
    attemptsLeft = OPACITY_MAX_ATTEMPTS
  ) {
    if (typeof window === 'undefined') return

    const run = () => {
      if (componentDisposed) {
        return
      }

      const shouldStop = runAttempt(attemptsLeft)
      if (shouldStop || attemptsLeft <= 1) {
        return
      }

      window.setTimeout(() => {
        window.requestAnimationFrame(() => {
          scheduleOpacityAttempt(runAttempt, 0, attemptsLeft - 1)
        })
      }, OPACITY_RETRY_DELAY_MS)
    }

    window.setTimeout(() => {
      window.requestAnimationFrame(run)
    }, initialDelayMs)
  }

  function setMarkerOpacityForSlug(slug: string, opacity: number) {
    for (const marker of markerById.values()) {
      const listingSlugs = Array.isArray(marker.__listingSlugs)
        ? marker.__listingSlugs
        : []

      if (!listingSlugs.includes(slug)) {
        continue
      }

      const chipElement = getMarkerChipElementForSlug(marker, slug)
      if (!chipElement) {
        return false
      }

      chipElement.style.opacity = String(opacity)
      return true
    }

    return false
  }

  function scheduleMarkerOpacityForSlug(slug: string, opacity: number, initialDelayMs = 0) {
    scheduleOpacityAttempt(() => setMarkerOpacityForSlug(slug, opacity), initialDelayMs)
  }

  function syncMarkers(groupsToRender: ListingMarkerGroup[]) {
    if (!markerClusterLayer) return

    const nextById = new Map<string, ListingMarkerGroup>()
    const markersToRemove: LeafletMarkerLike[] = []
    const markersToAdd: LeafletMarkerLike[] = []

    for (const group of groupsToRender) {
      nextById.set(group.__id, group)
    }

    for (const [id, marker] of markerById) {
      if (nextById.has(id)) continue

      marker.off()
      markersToRemove.push(marker)
      markerById.delete(id)
      markerMetaById.delete(id)
    }

    if (markersToRemove.length > 0) {
      if (typeof markerClusterLayer.removeLayers === 'function') {
        markerClusterLayer.removeLayers(markersToRemove)
      } else {
        markersToRemove.forEach((marker) => markerClusterLayer.removeLayer(marker))
      }
    }

    for (const group of groupsToRender) {
      const id = group.__id
      const nextMeta = buildMarkerGroupMeta(group)
      const existingMarker = markerById.get(id)

      if (!existingMarker) {
        const marker = createListingMarkerLayer(leaflet, houseIconUrl, group)
        markerById.set(id, marker)
        markerMetaById.set(id, nextMeta)
        markersToAdd.push(marker)
        continue
      }

      const previousMeta = markerMetaById.get(id)
      if (previousMeta === nextMeta) continue

      existingMarker.setLatLng([group.latitude, group.longitude])
      existingMarker.setIcon(createListingMarkerIcon(leaflet, houseIconUrl, group.listings))
      setMarkerListingMetadata(existingMarker, group)
      markerMetaById.set(id, nextMeta)
    }

    if (markersToAdd.length > 0) {
      if (typeof markerClusterLayer.addLayers === 'function') {
        markerClusterLayer.addLayers(markersToAdd)
      } else {
        markersToAdd.forEach((marker) => markerClusterLayer.addLayer(marker))
      }
    }

    if (active.value && activeListingSlug.value) {
      scheduleMarkerOpacityForSlug(activeListingSlug.value, getCatalogOverlayMapActiveOpacity())
    }
  }

  function renderMarkers() {
    if (!leaflet || !map || !markerClusterLayer) return

    syncMarkers(geolocatedListingGroups.value)
  }

  function cancelScheduledRender() {
    if (!renderAnimationFrame) return

    cancelAnimationFrame(renderAnimationFrame)
    renderAnimationFrame = 0
  }

  function scheduleRender() {
    if (renderAnimationFrame) {
      return
    }

    renderAnimationFrame = requestAnimationFrame(() => {
      renderAnimationFrame = 0
      renderMarkers()
    })
  }

  function handleMapVisibleAgain() {
    if (!map) return

    void nextTick(() => {
      requestAnimationFrame(() => {
        if (!map) return
        map.invalidateSize({ animate: false })
        scheduleRender()
      })
    })
  }

  function zoomIn() {
    if (!map) return
    map.zoomIn(1)
  }

  function zoomOut() {
    if (!map) return
    map.zoomOut(1)
  }

  function isMapZoomGestureActive() {
    if (!map) return false

    return Boolean(map._animatingZoom || map.touchZoom?._zooming)
  }

  function patchMarkerClusterFractionalZoomBehavior(layer: MarkerClusterLayerLike | null) {
    if (!layer || layer.__fractionalZoomPatched) return

    const originalZoomEnd = layer._zoomEnd
    const originalMoveEnd = layer._moveEnd
    layer.__fractionalZoomPatched = true

    layer._getClusterRenderZoom = function () {
      const mapZoom = Number(this._map?.getZoom?.() ?? this._map?._zoom)
      return getClusterRenderZoomLevel(mapZoom, Number(this.__lastMapZoom), Number(this._zoom))
    }

    layer._zoomEnd = function () {
      if (!this._map) {
        return
      }

      this._mergeSplitClusters()
      this._zoom = this._getClusterRenderZoom()
      this.__lastMapZoom = Number(this._map.getZoom())
      this._currentShownBounds = this._getExpandedVisibleBounds()
    }

    layer._moveEnd = function () {
      if (this._inZoomAnimation) {
        return
      }

      const newBounds = this._getExpandedVisibleBounds()
      const renderZoom = this._getClusterRenderZoom()

      this._topClusterLevel._recursivelyRemoveChildrenFromMap(
        this._currentShownBounds,
        Math.floor(this._map.getMinZoom()),
        this._zoom,
        newBounds
      )
      this._topClusterLevel._recursivelyAddChildrenToMap(null, renderZoom, newBounds)

      this._currentShownBounds = newBounds
    }

    layer._mergeSplitClusters = function () {
      const mapZoom = this._getClusterRenderZoom()

      this._processQueue()

      if (this._zoom < mapZoom && this._currentShownBounds.intersects(this._getExpandedVisibleBounds())) {
        this._animationStart()
        this._topClusterLevel._recursivelyRemoveChildrenFromMap(
          this._currentShownBounds,
          Math.floor(this._map.getMinZoom()),
          this._zoom,
          this._getExpandedVisibleBounds()
        )

        this._animationZoomIn(this._zoom, mapZoom)
      } else if (this._zoom > mapZoom) {
        this._animationStart()
        this._animationZoomOut(this._zoom, mapZoom)
      } else {
        this._moveEnd()
      }
    }

    if (layer._map) {
      layer._map.off('zoomend', originalZoomEnd, layer)
      layer._map.off('moveend', originalMoveEnd, layer)
      layer._map.on('zoomend', layer._zoomEnd, layer)
      layer._map.on('moveend', layer._moveEnd, layer)
    }

    layer.__lastMapZoom = Number(layer._map?.getZoom?.() ?? layer._map?._zoom)
  }

  function getVisibleMapInsets() {
    return {
      top: Math.max(0, Number(viewportInsets.value?.top) || 0),
      bottom: Math.max(0, Number(viewportInsets.value?.bottom) || 0)
    }
  }

  function getViewportInsetsKey() {
    const visibleInsets = getVisibleMapInsets()
    return `${Math.round(visibleInsets.top)}|${Math.round(visibleInsets.bottom)}`
  }

  function getBoundsFitTarget(bounds: LeafletBoundsLike) {
    if (!map || !leaflet) return null

    const mapSize = map.getSize()
    const visibleInsets = getVisibleMapInsets()
    const horizontalPadding = clamp(mapSize.x * CLUSTER_SAFE_AREA_X_RATIO, 40, 96)
    const topPadding = clamp(mapSize.y * CLUSTER_SAFE_AREA_TOP_RATIO, 48, 112)
    const bottomPadding = clamp(mapSize.y * CLUSTER_SAFE_AREA_BOTTOM_RATIO, 72, 160)

    return map._getBoundsCenterZoom(bounds, {
      paddingTopLeft: leaflet.point(horizontalPadding, visibleInsets.top + topPadding),
      paddingBottomRight: leaflet.point(horizontalPadding, visibleInsets.bottom + bottomPadding)
    })
  }

  function applyInitialFranceView(force = false) {
    if (!map || !leaflet) return
    if (hasUserAdjustedMapView && !force) return

    const viewportKey = getViewportInsetsKey()
    if (!force && lastInitialMapViewportKey === viewportKey) {
      return
    }

    const franceBounds = leaflet.latLngBounds(DEFAULT_FRANCE_BOUNDS)
    const fitTarget = getBoundsFitTarget(franceBounds)
    if (!fitTarget) return

    isApplyingInitialMapView = true
    map.setView(fitTarget.center, fitTarget.zoom, { animate: false })
    lastInitialMapViewportKey = viewportKey

    requestAnimationFrame(() => {
      isApplyingInitialMapView = false
    })
  }

  function animateClusterZoom(cluster: ClusterLike) {
    if (!map) return

    hasUserAdjustedMapView = true
    let childClusters = cluster._childClusters.slice()
    const bounds = cluster.getBounds()
    const fitTarget = getBoundsFitTarget(bounds)
    const boundsZoom = fitTarget?.zoom ?? map.getBoundsZoom(bounds)
    const currentZoom = map.getZoom()
    let targetZoom = cluster._zoom + 1

    while (childClusters.length > 0 && boundsZoom > targetZoom) {
      targetZoom += 1

      let nextChildClusters: ClusterLike[] = []
      for (const childCluster of childClusters) {
        nextChildClusters = nextChildClusters.concat(childCluster._childClusters)
      }
      childClusters = nextChildClusters
    }

    let center: unknown
    let zoom: number

    if (boundsZoom > targetZoom) {
      center = cluster.getLatLng()
      zoom = targetZoom
    } else if (boundsZoom <= currentZoom) {
      center = cluster.getLatLng()
      zoom = currentZoom + 1
    } else {
      const target = fitTarget ?? map._getBoundsCenterZoom(bounds)
      center = target.center
      zoom = target.zoom
    }

    map.setView(center, zoom, { animate: true, duration: 0.4 })
  }

  function isTouchFirstDevice() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }

    return window.matchMedia('(hover: none) and (pointer: coarse)').matches
  }

  onMounted(async () => {
    if (!mapContainer.value) return

    mapContainer.value.addEventListener('click', handleMapChipClick)

    const leafletModule = await import('leaflet')
    if (componentDisposed || !mapContainer.value) return

    const resolvedLeafletModule = leafletModule as unknown as LeafletModuleLike
    leaflet = resolvedLeafletModule.default || resolvedLeafletModule

    hadGlobalLeaflet = Object.prototype.hasOwnProperty.call(leafletGlobal, 'L')
    originalGlobalLeaflet = leafletGlobal.L

    leafletGlobal.L = leaflet
    await import('leaflet.markercluster/dist/leaflet.markercluster-src.js')
    if (componentDisposed || !mapContainer.value) return

    map = leaflet.map(mapContainer.value, {
      zoomControl: false,
      zoomSnap: 0,
      zoomDelta: 1,
      preferCanvas: true,
      markerZoomAnimation: true
    })
    map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM)

    map.on('movestart zoomstart', () => {
      if (isApplyingInitialMapView) {
        return
      }

      hasUserAdjustedMapView = true
    })

    map.on('move', () => {
      if (movePanThrottle !== null || isMapZoomGestureActive()) return

      movePanThrottle = window.setTimeout(() => {
        movePanThrottle = null

        if (markerClusterLayer && map && !isMapZoomGestureActive()) {
          markerClusterLayer._moveEnd()
        }
      }, 100)
    })

    const touchFirstDevice = isTouchFirstDevice()
    const useHighDensityTiles = touchFirstDevice && window.devicePixelRatio > 1
    const tileKeepBuffer = touchFirstDevice ? 4 : 2

    leaflet
      .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        detectRetina: useHighDensityTiles,
        updateWhenIdle: false,
        updateWhenZooming: true,
        keepBuffer: tileKeepBuffer
      })
      .addTo(map)

    const markerClusterFactory = leaflet.markerClusterGroup || leafletGlobal.L?.markerClusterGroup

    if (typeof markerClusterFactory !== 'function') {
      console.error('Leaflet markercluster plugin failed to load')
      return
    }

    markerClusterLayer = markerClusterFactory({
      animate: true,
      animateAddingMarkers: false,
      removeOutsideVisibleBounds: true,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: false,
      zoomToBoundsOnClick: false,
      disableClusteringAtZoom: 17,
      maxClusterRadius: 70,
      iconCreateFunction: (cluster: ClusterLike) => createClusterMarkerIcon(leaflet, houseMultipleIconUrl, getClusterListingCount(cluster))
    }).addTo(map)

    patchMarkerClusterFractionalZoomBehavior(markerClusterLayer)

    markerClusterLayer.on('clusterclick', (event: ClusterClickEventLike) => {
      animateClusterZoom(event.layer)
    })

    if (typeof ResizeObserver !== 'undefined' && mapContainer.value) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize({ animate: false })
      })
      resizeObserver.observe(mapContainer.value)
    }

    applyInitialFranceView(true)
    scheduleRender()
  })

  watch(listings, () => {
    if (!map) return
    scheduleRender()
  })

  watch(
    () => [viewportInsets.value?.top, viewportInsets.value?.bottom, active.value],
    ([, , isActive]) => {
      if (!map || !isActive) {
        return
      }

      applyInitialFranceView()
    }
  )

  watch(
    activeListingSlug,
    (nextSlug, previousSlug) => {
      if (previousSlug && previousSlug !== nextSlug) {
        scheduleMarkerOpacityForSlug(previousSlug, 1, nextSlug ? 0 : LISTING_RESTORE_OPACITY_DELAY_MS)
      }

      if (!active.value || !nextSlug) {
        return
      }

      scheduleMarkerOpacityForSlug(nextSlug, getCatalogOverlayMapActiveOpacity())
    },
    { immediate: true }
  )

  watch(active, (isActive) => {
    if (!isActive || !map) return
    handleMapVisibleAgain()

    if (activeListingSlug.value) {
      scheduleMarkerOpacityForSlug(activeListingSlug.value, getCatalogOverlayMapActiveOpacity())
    }
  })

  onBeforeUnmount(() => {
    componentDisposed = true
    cancelScheduledRender()
    if (movePanThrottle !== null) {
      clearTimeout(movePanThrottle)
      movePanThrottle = null
    }
    resizeObserver?.disconnect()
    resizeObserver = null
    mapContainer.value?.removeEventListener('click', handleMapChipClick)

    for (const marker of markerById.values()) {
      marker.off()
    }
    markerById.clear()
    markerMetaById.clear()

    if (map) {
      map.remove()
      map = null
      markerClusterLayer = null
      leaflet = null
    }

    if (hadGlobalLeaflet) {
      leafletGlobal.L = originalGlobalLeaflet
    } else {
      delete leafletGlobal.L
    }
  })

  return {
    geolocatedListings,
    zoomIn,
    zoomOut
  }
}