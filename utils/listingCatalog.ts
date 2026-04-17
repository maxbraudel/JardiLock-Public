import type {
  ListingSortField,
  ListingSortOrder,
  ListingSummary,
  LocationSuggestion
} from '../types/domain'
import {
  getAvailabilityHours,
  getIsoDayFromDate,
  isIsoDate,
  matchesLocation,
  type ListingDateAvailabilityMap
} from './listingFilters'

export type ListingCatalogFilterOptions = {
  selectedLocation: LocationSuggestion | null
  minArea: number
  maxPrice: number
  minCapacity: number
  selectedEquipment: string[]
  selectedEvents: string[]
  animalsOnly: boolean
  selectedDate: string
  selectedDays: number[]
  timeFrom: string
  timeTo: string
  publicHolidaysOnly: boolean
  availabilityByDate: Record<string, ListingDateAvailabilityMap>
}

export function filterListings(
  listings: ListingSummary[],
  filters: ListingCatalogFilterOptions
) {
  const normalizedSelectedDate = filters.selectedDate.trim()
  const hasSelectedDate = isIsoDate(normalizedSelectedDate)
  const selectedDateIsoDay = hasSelectedDate ? getIsoDayFromDate(normalizedSelectedDate) : null
  const selectedDateAvailabilities = hasSelectedDate
    ? filters.availabilityByDate[normalizedSelectedDate] || null
    : null

  return listings.filter((listing) => {
    const schedule = listing.effective_schedule || []
    const equipmentTags = new Set(listing.tags?.equipment || [])
    const eventTags = new Set(listing.tags?.event || [])
    const selectedDateAvailability = selectedDateAvailabilities?.[String(listing.id)] || null
    const selectedDateSchedule = selectedDateIsoDay === null
      ? null
      : schedule.find((entry) => entry.day_of_week === selectedDateIsoDay)

    const matchesSelectedLocation = !filters.selectedLocation || matchesLocation(listing, filters.selectedLocation)
    const matchesMinArea = listing.area_m2 >= filters.minArea
    const matchesMaxPrice = listing.price_cents <= filters.maxPrice
    const matchesMinCapacity = listing.capacity >= filters.minCapacity
    const matchesAnimals = !filters.animalsOnly || listing.animals_allowed
    const matchesEquipment = filters.selectedEquipment.length === 0
      || filters.selectedEquipment.every((tag) => equipmentTags.has(tag))
    const matchesEvents = filters.selectedEvents.length === 0
      || filters.selectedEvents.every((tag) => eventTags.has(tag))

    const matchesSelectedDate = (() => {
      if (!hasSelectedDate) return true

      if (selectedDateAvailability) {
        return selectedDateAvailability.status === 'open'
      }

      return selectedDateSchedule?.is_open === true
    })()

    const matchesDays = filters.selectedDays.length === 0
      || filters.selectedDays.every((day) => {
        const daySchedule = schedule.find((entry) => entry.day_of_week === day)
        return daySchedule?.is_open === true
      })

    const matchesHourWindow = (slot: { LDT_open_time: string; LDT_close_time: string }) => {
      if (filters.timeFrom && filters.timeTo) {
        if (slot.LDT_open_time > filters.timeFrom) return false
        if (slot.LDT_close_time < filters.timeTo) return false
        return true
      }

      const targetTime = filters.timeFrom || filters.timeTo
      if (!targetTime) return true

      if (slot.LDT_open_time > targetTime) return false
      if (slot.LDT_close_time < targetTime) return false
      return true
    }

    const matchesTimeRange = (() => {
      if (!filters.timeFrom && !filters.timeTo) return true

      if (hasSelectedDate) {
        if (selectedDateAvailability) {
          return getAvailabilityHours(selectedDateAvailability).some(matchesHourWindow)
        }

        if (!selectedDateSchedule?.is_open) return false
        return selectedDateSchedule.hours.some(matchesHourWindow)
      }

      if (filters.selectedDays.length > 0) {
        return filters.selectedDays.every((day) => {
          const daySchedule = schedule.find((entry) => entry.day_of_week === day)
          if (!daySchedule?.is_open) return false
          return daySchedule.hours.some(matchesHourWindow)
        })
      }

      return schedule.some((entry) => entry.is_open && entry.hours.some(matchesHourWindow))
    })()

    const matchesPublicHolidays = !filters.publicHolidaysOnly || !listing.exclude_public_holidays

    return (
      matchesSelectedLocation
      && matchesMinArea
      && matchesMaxPrice
      && matchesMinCapacity
      && matchesAnimals
      && matchesEquipment
      && matchesEvents
      && matchesSelectedDate
      && matchesDays
      && matchesTimeRange
      && matchesPublicHolidays
    )
  })
}

export function sortListings(
  listings: ListingSummary[],
  sortField: ListingSortField,
  sortOrder: ListingSortOrder
) {
  return [...listings].sort((left, right) => {
    let comparison = 0

    if (sortField === 'price_cents') {
      comparison = left.price_cents - right.price_cents
    } else if (sortField === 'area_m2') {
      comparison = (left.area_m2 || 0) - (right.area_m2 || 0)
    } else if (sortField === 'capacity') {
      comparison = (left.capacity || 0) - (right.capacity || 0)
    } else if (sortField === 'UTC_created_at') {
      comparison = new Date(left.UTC_created_at || 0).getTime() - new Date(right.UTC_created_at || 0).getTime()
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })
}

export function collectListingTagValues(
  listings: ListingSummary[],
  category: 'equipment' | 'event'
) {
  const values = new Set<string>()

  listings.forEach((listing) => {
    const tags = listing.tags?.[category] || []
    tags.forEach((tag) => values.add(tag))
  })

  return [...values].sort()
}

export function getAverageListingPrice(listings: ListingSummary[]) {
  if (listings.length === 0) {
    return 0
  }

  const total = listings.reduce((sum, listing) => sum + listing.price_cents, 0)
  return Math.round(total / listings.length)
}

export function getListingTitles(listings: ListingSummary[]) {
  return listings.map((listing) => listing.title)
}