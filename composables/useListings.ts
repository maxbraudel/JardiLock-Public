import { ref, computed, watch, onMounted } from 'vue'
import { fetchAllListings, fetchListingsAvailabilityByDate } from '~/services/api'
import type {
  ListingSortField,
  ListingSortOrder,
  ListingSummary,
  LocationSuggestion
} from '~/types/domain'
import { isIsoDate } from '~/utils/listingFilters'
import type { ListingDateAvailabilityMap } from '~/utils/listingFilters'
import { STORAGE_KEYS } from '~/utils/appState'
import {
  collectListingTagValues,
  filterListings,
  getAverageListingPrice,
  getListingTitles,
  sortListings,
  type ListingCatalogFilterOptions
} from '~/utils/listingCatalog'

function getStoredSortField(): ListingSortField {
  if (typeof window === 'undefined') return 'price_cents'

  const value = localStorage.getItem(STORAGE_KEYS.sortField)
  return value === 'area_m2' || value === 'capacity' || value === 'UTC_created_at'
    ? value
    : 'price_cents'
}

function getStoredSortOrder(): ListingSortOrder {
  if (typeof window === 'undefined') return 'asc'

  return localStorage.getItem(STORAGE_KEYS.sortOrder) === 'desc' ? 'desc' : 'asc'
}

export function useListings() {
  const allListings = ref<ListingSummary[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const availabilityByDate = ref<Record<string, ListingDateAvailabilityMap>>({})
  const pendingAvailabilityDates = new Set<string>()

  const locationQuery = ref('')
  const selectedLocation = ref<LocationSuggestion | null>(null)
  const sortField = ref<ListingSortField>(getStoredSortField())
  const sortOrder = ref<ListingSortOrder>(getStoredSortOrder())
  const minArea = ref(0)
  const maxPrice = ref(Infinity)
  const minCapacity = ref(0)
  const selectedEquipment = ref<string[]>([])
  const selectedEvents = ref<string[]>([])
  const animalsOnly = ref(false)
  const selectedDate = ref('')
  const selectedDays = ref<number[]>([])
  const timeFrom = ref('')
  const timeTo = ref('')
  const publicHolidaysOnly = ref(false)

  async function ensureDateAvailabilityLoaded(date: string) {
    const normalizedDate = date.trim()
    if (!isIsoDate(normalizedDate)) return
    if (availabilityByDate.value[normalizedDate] || pendingAvailabilityDates.has(normalizedDate)) return

    pendingAvailabilityDates.add(normalizedDate)

    try {
      const response = await fetchListingsAvailabilityByDate(normalizedDate)
      availabilityByDate.value = {
        ...availabilityByDate.value,
        [normalizedDate]: response.availabilities || {}
      }
    } catch (cause) {
      console.error(`Impossible de charger les disponibilites pour ${normalizedDate}.`, cause)
    } finally {
      pendingAvailabilityDates.delete(normalizedDate)
    }
  }

  watch(selectedDate, (newDate) => {
    if (!newDate) return
    void ensureDateAvailabilityLoaded(newDate)
  })

  const filterOptions = computed<ListingCatalogFilterOptions>(() => ({
    selectedLocation: selectedLocation.value,
    minArea: minArea.value,
    maxPrice: maxPrice.value,
    minCapacity: minCapacity.value,
    selectedEquipment: selectedEquipment.value,
    selectedEvents: selectedEvents.value,
    animalsOnly: animalsOnly.value,
    selectedDate: selectedDate.value,
    selectedDays: selectedDays.value,
    timeFrom: timeFrom.value,
    timeTo: timeTo.value,
    publicHolidaysOnly: publicHolidaysOnly.value,
    availabilityByDate: availabilityByDate.value
  }))

  const filteredListings = computed(() => filterListings(allListings.value, filterOptions.value))

  const sortedListings = computed(() => {
    return sortListings(filteredListings.value, sortField.value, sortOrder.value)
  })

  const availableEquipment = computed(() => {
    return collectListingTagValues(allListings.value, 'equipment')
  })

  const availableEvents = computed(() => {
    return collectListingTagValues(allListings.value, 'event')
  })

  const resultCount = computed(() => sortedListings.value.length)

  const averagePrice = computed(() => {
    return getAverageListingPrice(filteredListings.value)
  })

  const allTitles = computed(() => {
    return getListingTitles(allListings.value)
  })

  watch(sortField, (newVal) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.sortField, newVal)
  })

  watch(sortOrder, (newVal) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.sortOrder, newVal)
  })

  async function loadListings() {
    loading.value = true
    error.value = null
    try {
      allListings.value = await fetchAllListings()
      if (selectedDate.value) {
        void ensureDateAvailabilityLoaded(selectedDate.value)
      }
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Failed to load listings'
    } finally {
      loading.value = false
    }
  }

  onMounted(loadListings)

  return {
    filteredListings,
    sortedListings,
    loading,
    error,
    resultCount,
    averagePrice,
    allTitles,
    search: locationQuery,
    locationQuery,
    selectedLocation,
    sortField,
    sortOrder,
    minArea,
    maxPrice,
    minCapacity,
    selectedEquipment,
    selectedEvents,
    animalsOnly,
    selectedDate,
    selectedDays,
    timeFrom,
    timeTo,
    publicHolidaysOnly,
    availableEquipment,
    availableEvents,
    loadListings
  }
}
