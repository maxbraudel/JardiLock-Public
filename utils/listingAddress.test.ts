import { describe, expect, it } from 'vitest'
import { getListingWeatherCity } from './listingAddress'

describe('getListingWeatherCity', () => {
  it('extracts the city from a structured French address', () => {
    expect(getListingWeatherCity({
      address: '12 Rue des Fleurs, 75001 Paris, France',
      address_postal_code: '75001',
      address_street_number: '12',
      address_street_label: 'Rue des Fleurs'
    })).toBe('Paris')
  })

  it('falls back to the most specific remaining address segment', () => {
    expect(getListingWeatherCity({
      address: '13001 Marseille, FR',
      address_postal_code: '13001',
      address_street_number: null,
      address_street_label: null
    })).toBe('Marseille')
  })

  it('returns an empty string when no address is available', () => {
    expect(getListingWeatherCity(null)).toBe('')
  })
})