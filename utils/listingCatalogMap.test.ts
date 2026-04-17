import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MAP_ZOOM,
  getClusterListingCount,
  getClusterRenderZoomLevel,
  groupListingsByCoordinate,
  normalizeGeolocatedListings
} from './listingCatalogMap'

describe('normalizeGeolocatedListings', () => {
  it('keeps only listings with finite coordinates and normalizes ids', () => {
    const normalized = normalizeGeolocatedListings([
      { id: 12, latitude: '48.8566', longitude: '2.3522' },
      { id: 'skip-latitude', latitude: null, longitude: 2.1 },
      { id: 'skip-longitude', latitude: 44.1, longitude: Number.NaN }
    ])

    expect(normalized).toEqual([
      {
        id: 12,
        __id: '12',
        latitude: 48.8566,
        longitude: 2.3522
      }
    ])
  })
})

describe('groupListingsByCoordinate', () => {
  it('groups listings that collapse to the same coordinate precision bucket', () => {
    const grouped = groupListingsByCoordinate([
      {
        id: 'first',
        __id: 'first',
        latitude: 48.8566124,
        longitude: 2.3522219,
        price_cents: 12000
      },
      {
        id: 'second',
        __id: 'second',
        latitude: 48.85661249,
        longitude: 2.35222191,
        price_cents: 15000
      },
      {
        id: 'third',
        __id: 'third',
        latitude: 43.2965,
        longitude: 5.3698,
        price_cents: 18000
      }
    ])

    expect(grouped).toHaveLength(2)
    expect(grouped[0].listings.map((listing) => listing.__id)).toEqual(['first', 'second'])
    expect(grouped[1].listings.map((listing) => listing.__id)).toEqual(['third'])
  })
})

describe('getClusterListingCount', () => {
  it('sums grouped listing counts instead of raw child marker count', () => {
    const cluster = {
      getAllChildMarkers: () => [
        { __listingCount: 2 },
        { __listingCount: 3 },
        {}
      ]
    }

    expect(getClusterListingCount(cluster)).toBe(6)
  })

  it('falls back to childCount when markers are not available', () => {
    const cluster = {
      getChildCount: () => 4
    }

    expect(getClusterListingCount(cluster)).toBe(4)
  })
})

describe('getClusterRenderZoomLevel', () => {
  it('uses the previous cluster zoom when the map zoom is stable', () => {
    expect(getClusterRenderZoomLevel(7.0004, 7.0001, 8)).toBe(8)
  })

  it('rounds up or down when the map zoom crosses the epsilon threshold', () => {
    expect(getClusterRenderZoomLevel(7.2, 7, 7)).toBe(8)
    expect(getClusterRenderZoomLevel(6.8, 7, 7)).toBe(6)
  })

  it('falls back to the default map zoom when no zoom values are finite', () => {
    expect(getClusterRenderZoomLevel(Number.NaN, Number.NaN, Number.NaN)).toBe(DEFAULT_MAP_ZOOM)
  })
})