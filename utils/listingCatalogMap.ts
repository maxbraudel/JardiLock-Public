export interface ListingMapItem {
  id: string | number
  slug?: string
  price_cents?: number
  latitude?: number | null
  longitude?: number | null
}

export interface NormalizedListing extends ListingMapItem {
  __id: string
  latitude: number
  longitude: number
}

export interface ListingMarkerGroup {
  __id: string
  latitude: number
  longitude: number
  listings: NormalizedListing[]
}

export interface MapViewportInsets {
  top?: number
  bottom?: number
}

export interface MarkerListingMetadata {
  __listingCount?: number
  __listingSlugs?: string[]
  _icon?: HTMLElement | null
}

export interface LeafletMarkerLike extends MarkerListingMetadata {
  setLatLng: (latlng: [number, number]) => void
  setIcon: (icon: unknown) => void
  off: () => void
}

export interface MarkerClusterCountLike {
  getAllChildMarkers?: () => MarkerListingMetadata[]
  getChildCount?: () => number
}

type MarkerVariant = 'listing' | 'cluster'

export interface LeafletLike {
  marker: (latlng: [number, number], options: Record<string, unknown>) => LeafletMarkerLike
  divIcon: (options: Record<string, unknown>) => unknown
}

export const DEFAULT_MAP_CENTER: [number, number] = [46.603354, 1.888334]
export const DEFAULT_MAP_ZOOM = 6
export const DEFAULT_FRANCE_BOUNDS: [[number, number], [number, number]] = [
  [41.15, -5.75],
  [51.35, 9.75]
]

export const MARKER_GROUP_COORDINATE_PRECISION = 6
export const MARKER_GROUP_CHIP_GAP_PX = 6
export const CLUSTER_SAFE_AREA_X_RATIO = 0.08
export const CLUSTER_SAFE_AREA_TOP_RATIO = 0.1
export const CLUSTER_SAFE_AREA_BOTTOM_RATIO = 0.16
export const CLUSTER_ZOOM_EPSILON = 0.001

function toFiniteCoordinate(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

export function normalizeGeolocatedListings(listings: ListingMapItem[]): NormalizedListing[] {
  return listings
    .map((listing) => {
      const latitude = toFiniteCoordinate(listing.latitude)
      const longitude = toFiniteCoordinate(listing.longitude)

      return {
        ...listing,
        __id: String(listing.id),
        latitude,
        longitude
      }
    })
    .filter((listing) => Number.isFinite(listing.latitude) && Number.isFinite(listing.longitude))
}

export function groupListingsByCoordinate(listings: NormalizedListing[]): ListingMarkerGroup[] {
  const groups = new Map<string, ListingMarkerGroup>()

  for (const listing of listings) {
    const coordinateKey = getCoordinateGroupKey(listing.latitude, listing.longitude)
    const existingGroup = groups.get(coordinateKey)

    if (existingGroup) {
      existingGroup.listings.push(listing)
      continue
    }

    groups.set(coordinateKey, {
      __id: coordinateKey,
      latitude: listing.latitude,
      longitude: listing.longitude,
      listings: [listing]
    })
  }

  return Array.from(groups.values())
}

export function buildMarkerMeta(listing: NormalizedListing) {
  return [
    listing.latitude.toFixed(6),
    listing.longitude.toFixed(6),
    String(listing.price_cents ?? 0),
    String(listing.slug ?? '')
  ].join('|')
}

export function buildMarkerGroupMeta(group: ListingMarkerGroup) {
  return group.listings.map((listing) => buildMarkerMeta(listing)).join('||')
}

export function setMarkerListingMetadata(marker: LeafletMarkerLike, group: ListingMarkerGroup) {
  marker.__listingCount = group.listings.length
  marker.__listingSlugs = group.listings
    .map((listing) => (listing.slug ? String(listing.slug) : ''))
    .filter(Boolean)
}

export function createListingMarker(
  leaflet: LeafletLike,
  houseIconUrl: string,
  group: ListingMarkerGroup
) {
  const marker = leaflet.marker([group.latitude, group.longitude], {
    icon: createListingMarkerIcon(leaflet, houseIconUrl, group.listings),
    keyboard: false,
    riseOnHover: false
  })

  setMarkerListingMetadata(marker, group)

  return marker
}

export function createClusterMarkerIcon(
  leaflet: LeafletLike,
  houseMultipleIconUrl: string,
  listingCount: number
) {
  const label = `${listingCount} ${listingCount > 1 ? 'annonces' : 'annonce'}`
  const chipWidth = getMarkerChipWidth(label, 104)

  return leaflet.divIcon({
    className: 'catalog-map-cluster-icon-wrapper',
    html: createMarkerChipHtml(houseMultipleIconUrl, label, 'cluster'),
    iconSize: [chipWidth, 34],
    iconAnchor: [chipWidth / 2, 34]
  })
}

export function getLayerListingCount(layer: MarkerListingMetadata | null | undefined) {
  const listingCount = Number(layer?.__listingCount || 0)
  return listingCount > 0 ? listingCount : 1
}

export function getClusterListingCount(cluster: MarkerClusterCountLike | null | undefined) {
  if (typeof cluster?.getAllChildMarkers !== 'function') {
    return Number(cluster?.getChildCount?.() || 0)
  }

  return cluster.getAllChildMarkers().reduce((count: number, childMarker) => {
    return count + getLayerListingCount(childMarker)
  }, 0)
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function getClusterRenderZoomLevel(
  mapZoom: number,
  previousMapZoom: number,
  previousClusterZoom: number
) {
  if (!Number.isFinite(mapZoom)) {
    return Number.isFinite(previousClusterZoom) ? previousClusterZoom : DEFAULT_MAP_ZOOM
  }

  if (!Number.isFinite(previousMapZoom)) {
    return Math.round(mapZoom)
  }

  if (mapZoom > previousMapZoom + CLUSTER_ZOOM_EPSILON) {
    return Math.ceil(mapZoom)
  }

  if (mapZoom < previousMapZoom - CLUSTER_ZOOM_EPSILON) {
    return Math.floor(mapZoom)
  }

  return Number.isFinite(previousClusterZoom) ? previousClusterZoom : Math.round(mapZoom)
}

function getCoordinateGroupKey(latitude: number, longitude: number) {
  return [
    latitude.toFixed(MARKER_GROUP_COORDINATE_PRECISION),
    longitude.toFixed(MARKER_GROUP_COORDINATE_PRECISION)
  ].join('|')
}

function formatPrice(priceCents: number | undefined) {
  const cents = Number(priceCents || 0)
  const amount = Math.round(cents / 100)
  return `${amount.toLocaleString('fr-FR')} €`
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getMarkerChipWidth(label: string, minimumWidth: number) {
  return Math.max(minimumWidth, Math.round(label.length * 7.5) + 50)
}

function createMarkerChipHtml(
  iconUrl: string,
  label: string,
  variant: MarkerVariant,
  listingSlug?: string
) {
  const listingSlugAttribute = listingSlug ? ` data-listing-slug="${escapeHtml(listingSlug)}"` : ''

  return `
    <div class="catalog-map-marker-chip catalog-map-marker-chip--${variant}"${listingSlugAttribute}>
      <img class="catalog-map-marker-chip__icon" src="${escapeHtml(iconUrl)}" alt="" aria-hidden="true" />
      <span class="catalog-map-marker-chip__label">${escapeHtml(label)}</span>
    </div>
  `
}

function getListingChipWidth(listing: NormalizedListing) {
  return getMarkerChipWidth(formatPrice(listing.price_cents), 86)
}

export function createListingMarkerIcon(
  leaflet: LeafletLike,
  houseIconUrl: string,
  listings: NormalizedListing[]
) {
  const chipWidth = listings.reduce((width, listing) => width + getListingChipWidth(listing), 0)
  const totalGapWidth = Math.max(0, listings.length - 1) * MARKER_GROUP_CHIP_GAP_PX
  const iconWidth = chipWidth + totalGapWidth
  const html = `
    <div class="catalog-map-marker-group">
      ${listings
        .map((listing) => {
          const listingSlug = listing.slug ? String(listing.slug) : undefined
          return createMarkerChipHtml(
            houseIconUrl,
            formatPrice(listing.price_cents),
            'listing',
            listingSlug
          )
        })
        .join('')}
    </div>
  `

  return leaflet.divIcon({
    className: 'catalog-map-price-icon-wrapper',
    html,
    iconSize: [iconWidth, 34],
    iconAnchor: [iconWidth / 2, 34]
  })
}