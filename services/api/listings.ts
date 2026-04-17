import type {
  CreatedListingResponse,
  ListingDetails,
  ListingsAvailabilityByDateResponse,
  ListingSummary,
  LocationSuggestion,
  UserListingSummary
} from '~/types/domain'
import {
  normalizeAvailabilityByDateResponse,
  normalizeCreatedListingResponse,
  normalizeListingDetailsRecord,
  normalizeListingSummaryRecord,
  normalizeLocationSuggestion,
  normalizeUserListingSummary
} from './normalizers'
import {
  createJsonRequestOptions,
  createRequestOptions,
  getApiBase,
  parseJsonResponse
} from './runtime'

export async function fetchAllListings(): Promise<ListingSummary[]> {
  const response = await fetch(`${getApiBase()}/listings`, createRequestOptions())
  if (!response.ok) throw new Error('Failed to load listings')

  const payload = await parseJsonResponse<unknown>(response)
  if (!Array.isArray(payload)) return []

  return payload.map((entry) => normalizeListingSummaryRecord(entry))
}

export async function fetchListingsAvailabilityByDate(date: string): Promise<ListingsAvailabilityByDateResponse> {
  const response = await fetch(
    `${getApiBase()}/listings/availability-by-date?date=${encodeURIComponent(date)}`,
    createRequestOptions()
  )
  if (!response.ok) throw new Error('Failed to load availability for the selected date')

  const payload = await parseJsonResponse<unknown>(response)
  return normalizeAvailabilityByDateResponse(payload, date)
}

export async function fetchLocationSuggestions(query: string, signal?: AbortSignal): Promise<LocationSuggestion[]> {
  const trimmedQuery = query.trim()
  if (trimmedQuery.length < 2) return []

  const response = await fetch(`${getApiBase()}/locations/suggest?q=${encodeURIComponent(trimmedQuery)}`, {
    ...createRequestOptions(),
    signal
  })
  if (!response.ok) throw new Error('Failed to load location suggestions')

  const payload = await parseJsonResponse<unknown>(response)
  if (!Array.isArray(payload)) return []

  return payload.map((entry) => normalizeLocationSuggestion(entry))
}

export async function fetchListingBySlug(slug: string): Promise<ListingDetails> {
  const response = await fetch(`${getApiBase()}/listings/${encodeURIComponent(slug)}`, createRequestOptions())
  if (!response.ok) throw new Error('Listing not found')

  const payload = await parseJsonResponse<unknown>(response)
  return normalizeListingDetailsRecord(payload)
}

export async function createListing(data: Record<string, unknown>, token?: string | null): Promise<CreatedListingResponse> {
  const response = await fetch(`${getApiBase()}/listings`, createJsonRequestOptions('POST', data, token))

  if (!response.ok) {
    const err = await parseJsonResponse<{ error?: string }>(response).catch(() => ({ error: 'Creation failed' }))
    throw new Error(err.error || 'Creation failed')
  }

  const payload = await parseJsonResponse<unknown>(response)
  return normalizeCreatedListingResponse(payload)
}

export async function fetchUserListings(userId: number): Promise<UserListingSummary[]> {
  const response = await fetch(`${getApiBase()}/users/${userId}/listings`, createRequestOptions())
  if (!response.ok) throw new Error('Failed to fetch user listings')

  const payload = await parseJsonResponse<unknown>(response)
  if (!Array.isArray(payload)) return []

  return payload
    .map((entry) => normalizeUserListingSummary(entry))
    .filter((entry): entry is UserListingSummary => entry !== null)
}