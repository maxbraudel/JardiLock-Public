import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { fetchLocationSuggestions } from '~/services/api'
import type { LocationSuggestion } from '~/types/domain'

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_DELAY_MS = 300

interface UseLocationAutocompleteOptions {
  rootRef: Ref<HTMLElement | null>
  locationQuery: Ref<string>
  selectedLocation: Ref<LocationSuggestion | null>
  emitLocationQuery: (value: string) => void
  emitSelectedLocation: (value: LocationSuggestion | null) => void
  optionIdPrefix?: string
}

export function useLocationAutocomplete(options: UseLocationAutocompleteOptions) {
  const localLocationQuery = ref(options.locationQuery.value)
  const localSelectedLocation = ref<LocationSuggestion | null>(options.selectedLocation.value || null)
  const locationSuggestions = ref<LocationSuggestion[]>([])
  const hasLocationSuggestionsError = ref(false)
  const isLocationDropdownOpen = ref(false)
  const isLoadingLocations = ref(false)
  const activeLocationIndex = ref(-1)
  const optionIdPrefix = options.optionIdPrefix || 'location-option'

  const hasLocationDropdown = computed(() => {
    return isLocationDropdownOpen.value && localLocationQuery.value.trim().length >= MIN_QUERY_LENGTH
  })

  const activeLocationDescendant = computed(() => {
    const activeSuggestion = locationSuggestions.value[activeLocationIndex.value]
    return activeSuggestion ? `${optionIdPrefix}-${activeSuggestion.id}` : undefined
  })

  let pendingSearchTimeout: ReturnType<typeof setTimeout> | null = null
  let currentLocationsRequest = 0
  let activeAbortController: AbortController | null = null

  watch(options.locationQuery, (value) => {
    localLocationQuery.value = value
  })

  watch(options.selectedLocation, (value) => {
    localSelectedLocation.value = value || null
  })

  function resetLocationSuggestions() {
    locationSuggestions.value = []
    activeLocationIndex.value = -1
  }

  function cancelLocationSearch() {
    if (pendingSearchTimeout) {
      clearTimeout(pendingSearchTimeout)
      pendingSearchTimeout = null
    }

    if (activeAbortController) {
      activeAbortController.abort()
      activeAbortController = null
    }
  }

  function closeLocationDropdown() {
    isLocationDropdownOpen.value = false
    activeLocationIndex.value = -1
  }

  async function loadLocationSuggestions(query: string) {
    const trimmedQuery = query.trim()

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      cancelLocationSearch()
      isLoadingLocations.value = false
      hasLocationSuggestionsError.value = false
      resetLocationSuggestions()
      closeLocationDropdown()
      return
    }

    const requestId = ++currentLocationsRequest
    activeAbortController?.abort()
    const controller = new AbortController()
    activeAbortController = controller
    isLoadingLocations.value = true
    isLocationDropdownOpen.value = true

    try {
      const suggestions = await fetchLocationSuggestions(trimmedQuery, controller.signal)
      if (requestId !== currentLocationsRequest) return

      hasLocationSuggestionsError.value = false
      locationSuggestions.value = suggestions
      activeLocationIndex.value = suggestions.length > 0 ? 0 : -1
    } catch (error) {
      if (controller.signal.aborted || requestId !== currentLocationsRequest) return

      hasLocationSuggestionsError.value = true
      resetLocationSuggestions()
    } finally {
      if (requestId === currentLocationsRequest) {
        isLoadingLocations.value = false
        activeAbortController = null
      }
    }
  }

  function scheduleLocationSuggestions(query: string) {
    cancelLocationSearch()

    if (query.trim().length < MIN_QUERY_LENGTH) {
      isLoadingLocations.value = false
      hasLocationSuggestionsError.value = false
      resetLocationSuggestions()
      closeLocationDropdown()
      return
    }

    pendingSearchTimeout = setTimeout(() => {
      pendingSearchTimeout = null
      void loadLocationSuggestions(query)
    }, DEBOUNCE_DELAY_MS)
  }

  function handleLocationInput(eventOrValue: Event | string) {
    const value = typeof eventOrValue === 'string'
      ? eventOrValue
      : (eventOrValue.target as HTMLInputElement).value
    localLocationQuery.value = value

    if (localSelectedLocation.value) {
      localSelectedLocation.value = null
      options.emitSelectedLocation(null)
    }

    options.emitLocationQuery(value)
    scheduleLocationSuggestions(value)
  }

  function handleLocationFocus() {
    const trimmedQuery = localLocationQuery.value.trim()
    if (trimmedQuery.length < MIN_QUERY_LENGTH) return

    if (locationSuggestions.value.length > 0 || isLoadingLocations.value) {
      isLocationDropdownOpen.value = true
      return
    }

    scheduleLocationSuggestions(trimmedQuery)
  }

  function selectLocationSuggestion(suggestion: LocationSuggestion) {
    cancelLocationSearch()
    hasLocationSuggestionsError.value = false
    localSelectedLocation.value = suggestion
    localLocationQuery.value = suggestion.displayLabel
    options.emitSelectedLocation(suggestion)
    options.emitLocationQuery(suggestion.displayLabel)
    resetLocationSuggestions()
    closeLocationDropdown()
  }

  function handleLocationKeydown(event: KeyboardEvent) {
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && !hasLocationDropdown.value) {
      if (localLocationQuery.value.trim().length >= MIN_QUERY_LENGTH) {
        event.preventDefault()
        handleLocationFocus()
      }
      return
    }

    if (!hasLocationDropdown.value || locationSuggestions.value.length === 0) {
      if (event.key === 'Escape') {
        closeLocationDropdown()
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      activeLocationIndex.value = (activeLocationIndex.value + 1) % locationSuggestions.value.length
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      activeLocationIndex.value = activeLocationIndex.value <= 0
        ? locationSuggestions.value.length - 1
        : activeLocationIndex.value - 1
      return
    }

    if (event.key === 'Enter' && activeLocationIndex.value >= 0) {
      event.preventDefault()
      selectLocationSuggestion(locationSuggestions.value[activeLocationIndex.value])
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeLocationDropdown()
    }
  }

  function clearLocation() {
    cancelLocationSearch()
    localLocationQuery.value = ''
    localSelectedLocation.value = null
    hasLocationSuggestionsError.value = false
    options.emitLocationQuery('')
    options.emitSelectedLocation(null)
    isLoadingLocations.value = false
    resetLocationSuggestions()
    closeLocationDropdown()
  }

  function handleDocumentPointerDown(event: MouseEvent) {
    const target = event.target as Node | null
    if (!target || options.rootRef.value?.contains(target)) {
      return
    }

    closeLocationDropdown()
  }

  onMounted(() => {
    document.addEventListener('mousedown', handleDocumentPointerDown)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('mousedown', handleDocumentPointerDown)
    cancelLocationSearch()
  })

  return {
    activeLocationDescendant,
    activeLocationIndex,
    clearLocation,
    closeLocationDropdown,
    handleLocationFocus,
    handleLocationInput,
    handleLocationKeydown,
    hasLocationDropdown,
    hasLocationSuggestionsError,
    isLoadingLocations,
    localLocationQuery,
    localSelectedLocation,
    locationSuggestions,
    selectLocationSuggestion
  }
}