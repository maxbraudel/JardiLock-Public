import { describe, expect, it } from 'vitest'
import type { ListingSummary, LocationSuggestion } from '~/types/domain'
import {
  collectListingTagValues,
  filterListings,
  getAverageListingPrice,
  getListingTitles,
  sortListings
} from './listingCatalog'

function createListing(overrides: Partial<ListingSummary> = {}): ListingSummary {
  return {
    id: 'listing-1',
    title: 'Jardin A',
    slug: 'jardin-a',
    price_cents: 12000,
    currency: 'EUR',
    address: '12 Rue des Fleurs, 75001 Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    address_city_insee_code: '75056',
    address_department_code: '75',
    address_region_code: '11',
    address_country_code: 'FR',
    address_street_number: '12',
    address_street_label: 'Rue des Fleurs',
    address_postal_code: '75001',
    area_m2: 100,
    capacity: 30,
    animals_allowed: false,
    thumbnail: null,
    author: { id: 1, display_name: 'Alice' },
    tags: {
      equipment: ['parking'],
      event: ['mariage']
    },
    effective_schedule: Array.from({ length: 7 }, (_, dayOfWeek) => ({
      day_of_week: dayOfWeek,
      is_open: true,
      hours: [{ LDT_open_time: '09:00', LDT_close_time: '18:00' }]
    })),
    exclude_public_holidays: false,
    UTC_created_at: '2026-01-01T10:00:00.000Z',
    ...overrides
  }
}

function createCityLocation(overrides: Partial<LocationSuggestion> = {}): LocationSuggestion {
  return {
    id: 'paris',
    type: 'city',
    label: 'Paris',
    displayLabel: 'Paris',
    secondaryLabel: '75000 Paris',
    city: 'Paris',
    postcode: '75001',
    department: 'Paris',
    departmentCode: '75',
    region: 'Ile-de-France',
    regionCode: '11',
    cityInseeCode: '75056',
    streetNumber: null,
    streetLabel: null,
    countryCode: 'FR',
    latitude: 48.8566,
    longitude: 2.3522,
    matchTokens: ['paris'],
    filter: {
      exactPhrases: [],
      allTerms: ['Paris'],
      anyTerms: []
    },
    ...overrides
  }
}

describe('filterListings', () => {
  it('keeps only listings that satisfy location, tags and time filters', () => {
    const listings = [
      createListing(),
      createListing({
        id: 'listing-2',
        title: 'Jardin B',
        slug: 'jardin-b',
        address: '3 Chemin Vert, 13001 Marseille',
        address_city_insee_code: '13055',
        address_department_code: '13',
        address_region_code: '93',
        address_postal_code: '13001',
        tags: {
          equipment: ['piscine'],
          event: ['anniversaire']
        },
        effective_schedule: Array.from({ length: 7 }, (_, dayOfWeek) => ({
          day_of_week: dayOfWeek,
          is_open: true,
          hours: [{ LDT_open_time: '07:00', LDT_close_time: '08:00' }]
        }))
      })
    ]

    const filtered = filterListings(listings, {
      selectedLocation: createCityLocation(),
      minArea: 50,
      maxPrice: 15000,
      minCapacity: 10,
      selectedEquipment: ['parking'],
      selectedEvents: ['mariage'],
      animalsOnly: false,
      selectedDate: '',
      selectedDays: [0],
      timeFrom: '10:00',
      timeTo: '12:00',
      publicHolidaysOnly: false,
      availabilityByDate: {}
    })

    expect(filtered.map((listing) => listing.slug)).toEqual(['jardin-a'])
  })
})

describe('sortListings', () => {
  it('sorts listings by field and order', () => {
    const listings = [
      createListing({ id: 'listing-1', slug: 'a', capacity: 10 }),
      createListing({ id: 'listing-2', slug: 'b', capacity: 40 }),
      createListing({ id: 'listing-3', slug: 'c', capacity: 20 })
    ]

    expect(sortListings(listings, 'capacity', 'desc').map((listing) => listing.slug)).toEqual(['b', 'c', 'a'])
  })
})

describe('listingCatalog aggregates', () => {
  it('collects tags, average price and titles', () => {
    const listings = [
      createListing({ title: 'Jardin A', price_cents: 10000, tags: { equipment: ['parking'], event: ['mariage'] } }),
      createListing({ id: 'listing-2', title: 'Jardin B', slug: 'jardin-b', price_cents: 20000, tags: { equipment: ['piscine', 'parking'], event: ['anniversaire'] } })
    ]

    expect(collectListingTagValues(listings, 'equipment')).toEqual(['parking', 'piscine'])
    expect(getAverageListingPrice(listings)).toBe(15000)
    expect(getListingTitles(listings)).toEqual(['Jardin A', 'Jardin B'])
  })
})