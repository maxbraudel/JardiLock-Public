export const APP_STATE_KEYS = {
  overlayListingTitle: 'overlay-listing-title',
  overlayListingOrder: 'overlay-listing-order',
  catalogScrollTargetSlug: 'catalog-scroll-target-slug',
  catalogInitialLocationQuery: 'catalog-initial-location-query',
  catalogInitialSelectedLocation: 'catalog-initial-selected-location',
  catalogDesktopFiltersVisible: 'catalog-desktop-filters-visible',
  catalogViewMode: 'catalog-view-mode'
} as const

export const STORAGE_KEYS = {
  authToken: 'jardilock_token',
  favorites: 'jardilock_favorites',
  sortField: 'jardilock_sortField',
  sortOrder: 'jardilock_sortOrder'
} as const