import { describe, expect, it } from 'vitest'
import {
  normalizeCreatedListingResponse,
  normalizeListingDetailsRecord,
  normalizeListingSummaryRecord,
  normalizeUserListingSummary
} from './normalizers'

describe('listing normalizers', () => {
  it('preserves text listing ids across listing payloads', () => {
    const listingId = '64a40597-0285-474b-9779-48af9b21dc4a'
    const summary = normalizeListingSummaryRecord({
      id: listingId,
      title: 'Jardin test',
      slug: 'jardin-test',
      price_cents: 12000,
      currency: 'EUR',
      address: '12 Rue des Fleurs, 75001 Paris',
      area_m2: 120,
      capacity: 24
    })
    const details = normalizeListingDetailsRecord({
      ...summary,
      description: 'Description test',
      timezone: 'Europe/Paris',
      water_point: true,
      night_lighting: false,
      wheelchair_accessible: true,
      deposit_cents: null,
      cancellation_policy: null,
      images: [],
      availability: null
    })
    const created = normalizeCreatedListingResponse({
      id: listingId,
      slug: 'jardin-test'
    })
    const userListing = normalizeUserListingSummary({
      id: listingId,
      title: 'Jardin test',
      slug: 'jardin-test',
      price_cents: 12000,
      currency: 'EUR',
      address: '12 Rue des Fleurs, 75001 Paris',
      area_m2: 120,
      capacity: 24
    })

    expect(summary.id).toBe(listingId)
    expect(details.id).toBe(listingId)
    expect(created.id).toBe(listingId)
    expect(userListing?.id).toBe(listingId)
  })
})