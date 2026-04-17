import { describe, expect, it } from 'vitest'
import {
  getAvailabilityHours,
  getListingDepartmentCode,
  getListingRegionCode,
  inferDepartmentCodeFromPostalCode,
  matchesLocation
} from './listingFilters'

type TestListingAddress = Parameters<typeof matchesLocation>[0]
type TestLocationSuggestion = NonNullable<Parameters<typeof matchesLocation>[1]>

function createListingAddress(overrides: Partial<TestListingAddress> = {}): TestListingAddress {
  return {
    address: '12 Rue de Rivoli, 75001 Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    address_city_insee_code: '75056',
    address_department_code: null,
    address_region_code: null,
    address_country_code: 'FR',
    address_street_number: '12',
    address_street_label: 'Rue de Rivoli',
    address_postal_code: '75001',
    ...overrides
  }
}

function createLocationSuggestion(overrides: Partial<TestLocationSuggestion> = {}): TestLocationSuggestion {
  return {
    id: 'location-1',
    type: 'address',
    label: '12 Rue de Rivoli',
    displayLabel: '12 Rue de Rivoli, 75001 Paris',
    secondaryLabel: '75001 Paris',
    city: 'Paris',
    postcode: '75001',
    department: 'Paris',
    departmentCode: '75',
    region: 'Ile-de-France',
    regionCode: '11',
    cityInseeCode: '75056',
    streetNumber: '12',
    streetLabel: 'Rue de Rivoli',
    countryCode: 'FR',
    latitude: 48.85661,
    longitude: 2.35225,
    matchTokens: ['12', 'rue', 'rivoli', 'paris'],
    filter: {
      exactPhrases: ['Rue de Rivoli'],
      allTerms: ['Paris'],
      anyTerms: []
    },
    ...overrides
  }
}

describe('inferDepartmentCodeFromPostalCode', () => {
  it('infers a mainland department code from a standard postal code', () => {
    expect(inferDepartmentCodeFromPostalCode('75012', null)).toBe('75')
  })

  it('infers Corsica department codes using the INSEE prefix', () => {
    expect(inferDepartmentCodeFromPostalCode('20100', '2A004')).toBe('2A')
    expect(inferDepartmentCodeFromPostalCode('20200', '2B033')).toBe('2B')
  })
})

describe('listing administrative fallbacks', () => {
  it('falls back from postal code to department and region when explicit codes are missing', () => {
    const listing = createListingAddress({
      address_department_code: null,
      address_region_code: null,
      address_postal_code: '13001'
    })

    expect(getListingDepartmentCode(listing)).toBe('13')
    expect(getListingRegionCode(listing)).toBe('93')
  })
})

describe('getAvailabilityHours', () => {
  it('returns hours only for open availabilities', () => {
    expect(getAvailabilityHours({
      date: '2026-04-17',
      status: 'open',
      reason: 'default',
      detail: {
        hours: [{ LDT_open_time: '09:00', LDT_close_time: '18:00' }]
      }
    })).toEqual([{ LDT_open_time: '09:00', LDT_close_time: '18:00' }])

    expect(getAvailabilityHours({
      date: '2026-04-17',
      status: 'closed',
      reason: 'default_closed'
    })).toEqual([])
  })
})

describe('matchesLocation', () => {
  it('matches a city by INSEE code when available', () => {
    const listing = createListingAddress()
    const city = createLocationSuggestion({
      type: 'city',
      streetNumber: null,
      streetLabel: null,
      cityInseeCode: '75056'
    })

    expect(matchesLocation(listing, city)).toBe(true)
  })

  it('rejects a department filter when the listing falls in another department', () => {
    const listing = createListingAddress({
      address_department_code: '13',
      address_region_code: '93',
      address_postal_code: '13001'
    })
    const department = createLocationSuggestion({
      type: 'department',
      departmentCode: '75',
      cityInseeCode: null,
      postcode: null,
      streetNumber: null,
      streetLabel: null
    })

    expect(matchesLocation(listing, department)).toBe(false)
  })

  it('matches an address by coordinate proximity before street fallback', () => {
    const listing = createListingAddress({
      latitude: 48.85665,
      longitude: 2.3523,
      address_street_number: null,
      address_street_label: null
    })
    const address = createLocationSuggestion({
      type: 'address',
      streetNumber: '999',
      streetLabel: 'Unknown Street',
      latitude: 48.85662,
      longitude: 2.35228
    })

    expect(matchesLocation(listing, address)).toBe(true)
  })
})