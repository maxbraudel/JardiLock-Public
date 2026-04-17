import type { ListingDetails, ListingSummary } from '../types/domain'

type ListingAddressLike = Pick<
  ListingSummary,
  'address' | 'address_postal_code' | 'address_street_number' | 'address_street_label'
>

function normalizeAddressSegment(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .trim()
}

function getStreetFragment(listing: ListingAddressLike) {
  return normalizeAddressSegment([
    listing.address_street_number || '',
    listing.address_street_label || ''
  ].join(' '))
}

function removePostalCode(value: string, postalCode: string | null) {
  const escapedPostalCode = postalCode
    ? postalCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    : null

  const withoutStructuredPostalCode = escapedPostalCode
    ? value.replace(new RegExp(`\\b${escapedPostalCode}\\b`, 'g'), '')
    : value

  return withoutStructuredPostalCode.replace(/\b\d{5}\b/g, '')
}

function normalizeCandidateSegment(segment: string, listing: ListingAddressLike) {
  const streetFragment = getStreetFragment(listing)
  const normalizedSegment = removePostalCode(segment, listing.address_postal_code || null)
  const collapsedSegment = normalizeAddressSegment(normalizedSegment)

  if (!collapsedSegment) {
    return ''
  }

  if (streetFragment && collapsedSegment.toLowerCase() === streetFragment.toLowerCase()) {
    return ''
  }

  if (collapsedSegment.toLowerCase() === 'france' || collapsedSegment.toLowerCase() === 'fr') {
    return ''
  }

  return collapsedSegment
}

export function getListingWeatherCity(listing: ListingAddressLike | ListingDetails | null | undefined) {
  const address = listing?.address

  if (!address || typeof address !== 'string') {
    return ''
  }

  const segments = address
    .split(',')
    .map((segment) => normalizeCandidateSegment(segment, listing))
    .filter(Boolean)

  if (segments.length > 0) {
    return segments[segments.length - 1] || ''
  }

  return normalizeCandidateSegment(address, listing)
}