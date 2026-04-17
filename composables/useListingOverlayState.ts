import { computed, onBeforeUnmount, ref, type Ref, watch } from 'vue'
import { fetchListingBySlug } from '~/services/api'
import { useFavorites } from '~/composables/useFavorites'
import { useOverlayRoute } from '~/composables/useOverlayRoute'
import type { ListingDetails } from '~/types/domain'
import { APP_STATE_KEYS } from '~/utils/appState'
import { getListingWeatherCity } from '~/utils/listingAddress'

export function useListingOverlayState(slug: Ref<string>) {
  const listing = ref<ListingDetails | null>(null)
  const listingCache = ref<Record<string, ListingDetails>>({})
  const initialLoading = ref(true)
  const refreshing = ref(false)
  const loading = computed(() => initialLoading.value || refreshing.value)
  const error = ref<string | null>(null)
  const overlayListingOrder = useState<string[]>(APP_STATE_KEYS.overlayListingOrder, () => [])
  const catalogScrollTargetSlug = useState<string | null>(APP_STATE_KEYS.catalogScrollTargetSlug, () => null)
  const inFlightListingRequests = new Map<string, Promise<ListingDetails>>()

  let activeLoadToken = 0

  const { openListing, setListingTitle } = useOverlayRoute()
  const { isFavorite, toggleFavorite } = useFavorites()

  const isFavoriteListing = computed(() => {
    return listing.value ? isFavorite(listing.value.id) : false
  })

  const currentListingIndex = computed(() => {
    return overlayListingOrder.value.findIndex((candidateSlug: string) => candidateSlug === slug.value)
  })

  const previousListingSlug = computed(() => {
    return currentListingIndex.value > 0
      ? overlayListingOrder.value[currentListingIndex.value - 1]
      : null
  })

  const nextListingSlug = computed(() => {
    return currentListingIndex.value >= 0 && currentListingIndex.value < overlayListingOrder.value.length - 1
      ? overlayListingOrder.value[currentListingIndex.value + 1]
      : null
  })

  const weatherCity = computed(() => getListingWeatherCity(listing.value))

  function handleToggleFavorite() {
    if (listing.value) {
      toggleFavorite(listing.value.id)
    }
  }

  function getCachedListing(targetSlug: string) {
    return listingCache.value[targetSlug] || null
  }

  function cacheListing(targetSlug: string, data: ListingDetails) {
    listingCache.value = {
      ...listingCache.value,
      [targetSlug]: data
    }
  }

  function fetchListingWithCache(targetSlug: string) {
    const cached = getCachedListing(targetSlug)
    if (cached) {
      return Promise.resolve(cached)
    }

    const existingRequest = inFlightListingRequests.get(targetSlug)
    if (existingRequest) {
      return existingRequest
    }

    const request = fetchListingBySlug(targetSlug)
      .then((data) => {
        cacheListing(targetSlug, data)
        return data
      })
      .finally(() => {
        if (inFlightListingRequests.get(targetSlug) === request) {
          inFlightListingRequests.delete(targetSlug)
        }
      })

    inFlightListingRequests.set(targetSlug, request)
    return request
  }

  function prefetchListing(targetSlug: string | null) {
    if (!targetSlug || getCachedListing(targetSlug) || inFlightListingRequests.has(targetSlug)) {
      return
    }

    void fetchListingWithCache(targetSlug).catch(() => {})
  }

  function prefetchAdjacentListings() {
    prefetchListing(previousListingSlug.value)
    prefetchListing(nextListingSlug.value)
  }

  function goToPreviousListing() {
    if (!previousListingSlug.value) {
      return
    }

    catalogScrollTargetSlug.value = previousListingSlug.value
    openListing(previousListingSlug.value)
  }

  function goToNextListing() {
    if (!nextListingSlug.value) {
      return
    }

    catalogScrollTargetSlug.value = nextListingSlug.value
    openListing(nextListingSlug.value)
  }

  async function loadListing() {
    const targetSlug = slug.value
    const loadToken = ++activeLoadToken
    const cached = getCachedListing(targetSlug)
    const hasVisibleListing = Boolean(listing.value)

    error.value = null

    if (cached) {
      listing.value = cached
      setListingTitle(cached.title)
      initialLoading.value = false
      refreshing.value = false
      prefetchAdjacentListings()
      return
    }

    if (hasVisibleListing) {
      refreshing.value = true
    } else {
      initialLoading.value = true
    }

    try {
      const data = await fetchListingWithCache(targetSlug)
      if (loadToken !== activeLoadToken) {
        return
      }

      listing.value = data
      setListingTitle(data.title)
      prefetchAdjacentListings()
    } catch (cause) {
      if (loadToken !== activeLoadToken) {
        return
      }

      error.value = cause instanceof Error ? cause.message : 'Impossible de charger cette annonce.'
      listing.value = null
      setListingTitle(null)
    } finally {
      if (loadToken === activeLoadToken) {
        initialLoading.value = false
        refreshing.value = false
      }
    }
  }

  watch(slug, () => {
    loadListing()
  }, { immediate: true })

  onBeforeUnmount(() => {
    setListingTitle(null)
  })

  return {
    error,
    handleToggleFavorite,
    initialLoading,
    isFavoriteListing,
    listing,
    loading,
    nextListingSlug,
    previousListingSlug,
    refreshing,
    goToNextListing,
    goToPreviousListing,
    weatherCity
  }
}