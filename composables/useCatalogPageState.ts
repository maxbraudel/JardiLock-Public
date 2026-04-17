import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComputedRef,
  type WritableComputedRef
} from 'vue'
import { useOverlayRoute } from '~/composables/useOverlayRoute'
import type {
  CatalogFiltersState,
  ListingSortField,
  ListingSortOrder,
  ListingSummary,
  LocationSuggestion
} from '~/types/domain'
import { APP_STATE_KEYS } from '~/utils/appState'

type ListingMapController = {
  zoomIn: () => void
  zoomOut: () => void
}

type ListingGridController = {
  scrollToListing: (slug: string) => boolean
}

type ResultsContainerController = {
  scrollTo: (options: ScrollToOptions | number) => void
  getScrollTop: () => number
}

type CatalogPageStateOptions = {
  sortedListings: ComputedRef<ListingSummary[]>
  resultCount: ComputedRef<number>
  catalogFilters: WritableComputedRef<CatalogFiltersState>
  locationQuery: { value: string }
  selectedLocation: { value: LocationSuggestion | null }
  sortField: { value: ListingSortField }
  sortOrder: { value: ListingSortOrder }
}

function getDefaultCatalogFilters(): CatalogFiltersState {
  return {
    minArea: 0,
    maxPrice: Infinity,
    selectedEquipment: [],
    selectedEvents: [],
    animalsOnly: false,
    selectedDays: [],
    timeFrom: '',
    timeTo: '',
    publicHolidaysOnly: false
  }
}

function parsePixelValue(value: string) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function useCatalogPageState(options: CatalogPageStateOptions) {
  const { isFiltersOpen, openFilters, closeFilters } = useOverlayRoute()

  const overlayListingOrder = useState<string[]>(APP_STATE_KEYS.overlayListingOrder, () => [])
  const catalogScrollTargetSlug = useState<string | null>(APP_STATE_KEYS.catalogScrollTargetSlug, () => null)
  const pendingInitLocation = useState<string>(APP_STATE_KEYS.catalogInitialLocationQuery, () => '')
  const pendingInitSelectedLocation = useState<LocationSuggestion | null>(APP_STATE_KEYS.catalogInitialSelectedLocation, () => null)
  const desktopFiltersVisible = useState<boolean>(APP_STATE_KEYS.catalogDesktopFiltersVisible, () => true)
  const catalogViewMode = useState<'catalog' | 'map'>(APP_STATE_KEYS.catalogViewMode, () => 'catalog')

  const isMobileViewport = ref(false)
  const toolbarRef = ref<HTMLElement | null>(null)
  const bottomBarRef = ref<HTMLElement | null>(null)
  const mapShellRef = ref<HTMLElement | null>(null)
  const listingMapRef = ref<ListingMapController | null>(null)
  const listingGridRef = ref<ListingGridController | null>(null)
  const resultsContainer = ref<ResultsContainerController | null>(null)
  const showScrollToTop = ref(false)
  const catalogToolbarHeight = ref(0)
  const catalogBottomBarHeight = ref(0)
  const mapViewportInsets = ref({ top: 0, bottom: 0 })
  const hasMapBeenActivated = ref(catalogViewMode.value === 'map')

  let layoutResizeObserver: ResizeObserver | null = null

  const isDesktopFiltersCollapsed = computed(() => !isMobileViewport.value && !desktopFiltersVisible.value)
  const showDesktopFilters = computed(() => desktopFiltersVisible.value)
  const isMapView = computed(() => catalogViewMode.value === 'map')
  const shouldMountMap = computed(() => hasMapBeenActivated.value || isMapView.value)
  const catalogViewToggleLabel = computed(() => (isMapView.value ? 'Catalogue' : 'Carte'))

  const catalogMainStyle = computed(() => {
    if (catalogToolbarHeight.value <= 0) {
      return undefined
    }

    return {
      '--catalog-toolbar-height': `${catalogToolbarHeight.value}px`
    }
  })

  const activeFilterCount = computed(() => {
    const filters = options.catalogFilters.value
    let count = 0
    if (filters.minArea > 0) count += 1
    if (filters.maxPrice < Infinity && filters.maxPrice > 0) count += 1
    if (filters.selectedEquipment.length > 0) count += 1
    if (filters.selectedEvents.length > 0) count += 1
    if (filters.animalsOnly) count += 1
    if (filters.selectedDays.length > 0) count += 1
    if (filters.timeFrom) count += 1
    if (filters.timeTo) count += 1
    if (filters.publicHolidaysOnly) count += 1
    return count
  })

  const sidebarResultLabel = computed(() => {
    const count = Number(options.resultCount.value) || 0
    return `${count} annonce${count !== 1 ? 's' : ''}`
  })

  function clearAllFilters() {
    options.catalogFilters.value = getDefaultCatalogFilters()
  }

  function toggleDesktopFilters() {
    desktopFiltersVisible.value = !desktopFiltersVisible.value
  }

  function closeDesktopFilters() {
    desktopFiltersVisible.value = false
  }

  function toggleCatalogViewMode() {
    const nextMode = isMapView.value ? 'catalog' : 'map'
    if (nextMode === 'map') {
      hasMapBeenActivated.value = true
    }

    catalogViewMode.value = nextMode
  }

  function updateCatalogToolbarHeight() {
    catalogToolbarHeight.value = toolbarRef.value
      ? Math.ceil(toolbarRef.value.getBoundingClientRect().height)
      : 0
  }

  function updateCatalogBottomBarHeight() {
    catalogBottomBarHeight.value = bottomBarRef.value
      ? Math.ceil(bottomBarRef.value.getBoundingClientRect().height)
      : 0
  }

  function updateMapViewportInsets() {
    if (typeof window === 'undefined' || !mapShellRef.value) {
      mapViewportInsets.value = { top: 0, bottom: 0 }
      return
    }

    const mapShellStyle = window.getComputedStyle(mapShellRef.value)
    const shellPaddingTop = parsePixelValue(mapShellStyle.paddingTop)
    const shellPaddingBottom = parsePixelValue(mapShellStyle.paddingBottom)

    mapViewportInsets.value = {
      top: Math.max(0, Math.ceil(catalogToolbarHeight.value - shellPaddingTop)),
      bottom: Math.max(0, Math.ceil(catalogBottomBarHeight.value - shellPaddingBottom))
    }
  }

  function updateCatalogLayoutMetrics() {
    updateCatalogToolbarHeight()
    updateCatalogBottomBarHeight()
    updateMapViewportInsets()
  }

  function scheduleCatalogLayoutMetricsUpdate() {
    if (typeof window === 'undefined') {
      return
    }

    void nextTick(() => {
      window.requestAnimationFrame(() => {
        updateCatalogLayoutMetrics()
      })
    })
  }

  function startLayoutResizeObserver() {
    layoutResizeObserver?.disconnect()
    layoutResizeObserver = null

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    layoutResizeObserver = new ResizeObserver(() => {
      updateCatalogLayoutMetrics()
    })

    if (toolbarRef.value) {
      layoutResizeObserver.observe(toolbarRef.value)
    }

    if (bottomBarRef.value) {
      layoutResizeObserver.observe(bottomBarRef.value)
    }
  }

  function updateViewport() {
    if (typeof window === 'undefined') {
      return
    }

    isMobileViewport.value = window.innerWidth <= 1024

    if (!isMobileViewport.value && isFiltersOpen.value) {
      closeFilters()
    }

    scheduleCatalogLayoutMetricsUpdate()
  }

  function openMobileFilters() {
    openFilters()
  }

  function closeMobileFilters() {
    closeFilters()
  }

  function handleBottomFiltersAction() {
    if (isMobileViewport.value) {
      openMobileFilters()
      return
    }

    toggleDesktopFilters()
  }

  function updateScrollToTopVisibility() {
    if (isMapView.value) {
      showScrollToTop.value = false
      return
    }

    showScrollToTop.value = (resultsContainer.value?.getScrollTop() || 0) > 0
  }

  function handleResultsScroll(event: { scrollTop: number }) {
    showScrollToTop.value = event.scrollTop > 0
  }

  function scrollResultsToTop() {
    if (isMapView.value) return
    resultsContainer.value?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function zoomMapIn() {
    listingMapRef.value?.zoomIn()
  }

  function zoomMapOut() {
    listingMapRef.value?.zoomOut()
  }

  function handleSortChange(field: ListingSortField, order: ListingSortOrder) {
    options.sortField.value = field
    options.sortOrder.value = order
  }

  function applyPendingInitialLocation() {
    if (!pendingInitLocation.value) return

    options.locationQuery.value = pendingInitLocation.value
    options.selectedLocation.value = pendingInitSelectedLocation.value
    pendingInitLocation.value = ''
    pendingInitSelectedLocation.value = null
  }

  watch(isMapView, (mapViewEnabled) => {
    if (mapViewEnabled) {
      hasMapBeenActivated.value = true
    }

    scheduleCatalogLayoutMetricsUpdate()

    if (mapViewEnabled) {
      showScrollToTop.value = false
      return
    }

    void nextTick(() => {
      updateScrollToTopVisibility()
    })
  })

  watch(
    options.sortedListings,
    (listings) => {
      overlayListingOrder.value = listings
        .map((listing) => listing.slug)
        .filter((slug): slug is string => Boolean(slug))
    },
    { immediate: true }
  )

  watch(
    () => catalogScrollTargetSlug.value,
    async (targetSlug) => {
      if (!targetSlug) return

      await nextTick()
      listingGridRef.value?.scrollToListing(targetSlug)
      catalogScrollTargetSlug.value = null
    }
  )

  onMounted(() => {
    updateViewport()
    window.addEventListener('resize', updateViewport)
    updateScrollToTopVisibility()
    startLayoutResizeObserver()
    scheduleCatalogLayoutMetricsUpdate()
    applyPendingInitialLocation()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateViewport)
    layoutResizeObserver?.disconnect()
    layoutResizeObserver = null
    overlayListingOrder.value = []
  })

  return {
    activeFilterCount,
    bottomBarRef,
    catalogMainStyle,
    catalogViewToggleLabel,
    clearAllFilters,
    closeDesktopFilters,
    closeMobileFilters,
    desktopFiltersVisible,
    handleBottomFiltersAction,
    handleResultsScroll,
    handleSortChange,
    isDesktopFiltersCollapsed,
    isFiltersOpen,
    isMapView,
    isMobileViewport,
    listingGridRef,
    listingMapRef,
    mapShellRef,
    mapViewportInsets,
    resultsContainer,
    scrollResultsToTop,
    shouldMountMap,
    showDesktopFilters,
    showScrollToTop,
    sidebarResultLabel,
    toggleCatalogViewMode,
    toolbarRef,
    zoomMapIn,
    zoomMapOut
  }
}