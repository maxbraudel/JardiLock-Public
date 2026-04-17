import type {
  ListingDateAvailability,
  ListingScheduleSlot,
  ListingSummary,
  LocationSuggestion
} from '~/types/domain'

type ListingAddressRecord = Pick<
  ListingSummary,
  | 'address'
  | 'latitude'
  | 'longitude'
  | 'address_city_insee_code'
  | 'address_department_code'
  | 'address_region_code'
  | 'address_country_code'
  | 'address_street_number'
  | 'address_street_label'
  | 'address_postal_code'
>

const DEPARTMENT_TO_REGION_CODE: Record<string, string> = {
  '01': '84', '02': '32', '03': '84', '04': '93', '05': '93', '06': '93', '07': '84',
  '08': '44', '09': '76', '10': '44', '11': '76', '12': '76', '13': '93', '14': '28',
  '15': '84', '16': '75', '17': '75', '18': '24', '19': '75', '21': '27', '22': '53',
  '23': '75', '24': '75', '25': '27', '26': '84', '27': '28', '28': '24', '29': '53',
  '2A': '94', '2B': '94', '30': '76', '31': '76', '32': '76', '33': '75', '34': '76',
  '35': '53', '36': '24', '37': '24', '38': '84', '39': '27', '40': '75', '41': '24',
  '42': '84', '43': '84', '44': '52', '45': '24', '46': '76', '47': '75', '48': '76',
  '49': '52', '50': '28', '51': '44', '52': '44', '53': '52', '54': '44', '55': '44',
  '56': '53', '57': '44', '58': '27', '59': '32', '60': '32', '61': '28', '62': '32',
  '63': '84', '64': '75', '65': '76', '66': '76', '67': '44', '68': '44', '69': '84',
  '70': '27', '71': '27', '72': '52', '73': '84', '74': '84', '75': '11', '76': '28',
  '77': '11', '78': '11', '79': '75', '80': '32', '81': '76', '82': '76', '83': '93',
  '84': '93', '85': '52', '86': '75', '87': '75', '88': '44', '89': '27', '90': '27',
  '91': '11', '92': '11', '93': '11', '94': '11', '95': '11',
  '971': '01', '972': '02', '973': '03', '974': '04', '976': '06'
}

export type ListingDateAvailabilityMap = Record<string, ListingDateAvailability>

export function normalizeText(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function normalizeCode(value: unknown) {
  const normalized = String(value || '').trim().toUpperCase()
  return normalized.length > 0 ? normalized : null
}

export function inferDepartmentCodeFromPostalCode(postalCode: string | null, cityInseeCode: string | null) {
  const normalizedPostalCode = normalizeCode(postalCode)
  if (!normalizedPostalCode) return null

  if (!/^\d{4,5}$/.test(normalizedPostalCode)) return null
  if (normalizedPostalCode.length === 4) return null

  if (normalizedPostalCode.startsWith('97') || normalizedPostalCode.startsWith('98')) {
    return normalizedPostalCode.slice(0, 3)
  }

  if (normalizedPostalCode.startsWith('20')) {
    const normalizedInsee = normalizeCode(cityInseeCode)
    if (normalizedInsee?.startsWith('2A')) return '2A'
    if (normalizedInsee?.startsWith('2B')) return '2B'
    return null
  }

  return normalizedPostalCode.slice(0, 2)
}

export function getListingDepartmentCode(listing: ListingAddressRecord) {
  const normalizedDepartmentCode = normalizeCode(listing.address_department_code)
  if (normalizedDepartmentCode) return normalizedDepartmentCode

  return inferDepartmentCodeFromPostalCode(
    normalizeCode(listing.address_postal_code),
    normalizeCode(listing.address_city_insee_code)
  )
}

export function getListingRegionCode(listing: ListingAddressRecord) {
  const normalizedRegionCode = normalizeCode(listing.address_region_code)
  if (normalizedRegionCode) return normalizedRegionCode

  const departmentCode = getListingDepartmentCode(listing)
  if (!departmentCode) return null

  return DEPARTMENT_TO_REGION_CODE[departmentCode] || null
}

export function toFiniteNumber(value: unknown) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

export function computeDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180

  const earthRadiusKm = 6371
  const dLat = toRadians(latitudeB - latitudeA)
  const dLon = toRadians(longitudeB - longitudeA)
  const lat1 = toRadians(latitudeA)
  const lat2 = toRadians(latitudeB)

  const haversine =
    Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine))
}

export function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function getIsoDayFromDate(date: string) {
  const parsedDate = new Date(`${date}T12:00:00Z`)
  const jsDay = parsedDate.getUTCDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

export function getAvailabilityHours(
  availability: ListingDateAvailability | null | undefined
): ListingScheduleSlot[] {
  if (availability?.status !== 'open') return []
  return availability.detail?.hours || []
}

function fallbackFilterMatch(address: string, location: LocationSuggestion) {
  const normalizedAddress = normalizeText(address)
  if (!normalizedAddress) return false

  const exactMatch = location.filter.exactPhrases
    .map(normalizeText)
    .filter(Boolean)
    .some((phrase) => normalizedAddress.includes(phrase))

  if (exactMatch) return true

  const hasAllTerms = location.filter.allTerms
    .map(normalizeText)
    .filter(Boolean)
    .every((term) => normalizedAddress.includes(term))

  if (!hasAllTerms) return false

  const anyTerms = location.filter.anyTerms
    .map(normalizeText)
    .filter(Boolean)

  return anyTerms.length === 0 || anyTerms.some((term) => normalizedAddress.includes(term))
}

function matchesCountry(listing: ListingAddressRecord, location: LocationSuggestion) {
  const selectedCountryCode = normalizeCode(location.countryCode)
  if (!selectedCountryCode) return true

  const listingCountryCode = normalizeCode(listing.address_country_code)
  if (!listingCountryCode) return true

  return listingCountryCode === selectedCountryCode
}

function matchesRegion(listing: ListingAddressRecord, location: LocationSuggestion) {
  const selectedRegionCode = normalizeCode(location.regionCode)
  if (!selectedRegionCode) {
    return fallbackFilterMatch(listing.address, location)
  }

  const listingRegionCode = getListingRegionCode(listing)
  if (listingRegionCode) {
    return listingRegionCode === selectedRegionCode
  }

  return fallbackFilterMatch(listing.address, location)
}

function matchesDepartment(listing: ListingAddressRecord, location: LocationSuggestion) {
  const selectedDepartmentCode = normalizeCode(location.departmentCode)
  if (!selectedDepartmentCode) {
    return fallbackFilterMatch(listing.address, location)
  }

  const listingDepartmentCode = getListingDepartmentCode(listing)
  if (listingDepartmentCode) {
    return listingDepartmentCode === selectedDepartmentCode
  }

  return fallbackFilterMatch(listing.address, location)
}

function matchesCity(listing: ListingAddressRecord, location: LocationSuggestion) {
  const selectedCityInseeCode = normalizeCode(location.cityInseeCode)
  if (selectedCityInseeCode) {
    const listingCityInseeCode = normalizeCode(listing.address_city_insee_code)
    if (listingCityInseeCode) {
      return listingCityInseeCode === selectedCityInseeCode
    }
  }

  const selectedPostalCode = normalizeCode(location.postcode)
  const selectedCityName = normalizeText(location.city || location.label)
  const listingPostalCode = normalizeCode(listing.address_postal_code)
  const listingAddress = normalizeText(listing.address)

  if (selectedPostalCode && selectedCityName && listingPostalCode) {
    return listingPostalCode === selectedPostalCode && listingAddress.includes(selectedCityName)
  }

  return fallbackFilterMatch(listing.address, location)
}

function matchesAdministrativeScope(listing: ListingAddressRecord, location: LocationSuggestion) {
  const selectedCityInseeCode = normalizeCode(location.cityInseeCode)
  if (selectedCityInseeCode) {
    const listingCityInseeCode = normalizeCode(listing.address_city_insee_code)
    if (listingCityInseeCode) {
      return listingCityInseeCode === selectedCityInseeCode
    }
  }

  const selectedDepartmentCode = normalizeCode(location.departmentCode)
  if (selectedDepartmentCode) {
    const listingDepartmentCode = getListingDepartmentCode(listing)
    if (listingDepartmentCode) {
      return listingDepartmentCode === selectedDepartmentCode
    }
  }

  const selectedRegionCode = normalizeCode(location.regionCode)
  if (selectedRegionCode) {
    const listingRegionCode = getListingRegionCode(listing)
    if (listingRegionCode) {
      return listingRegionCode === selectedRegionCode
    }
  }

  const selectedPostalCode = normalizeCode(location.postcode)
  if (selectedPostalCode) {
    return normalizeCode(listing.address_postal_code) === selectedPostalCode
  }

  return true
}

function matchesStreet(listing: ListingAddressRecord, location: LocationSuggestion) {
  const selectedStreetLabel = normalizeText(location.streetLabel || location.label)
  const selectedStreetNumber = normalizeCode(location.streetNumber)
  const selectedPostalCode = normalizeCode(location.postcode)

  const listingStreetLabel = normalizeText(listing.address_street_label)
  const listingStreetNumber = normalizeCode(listing.address_street_number)
  const listingPostalCode = normalizeCode(listing.address_postal_code)
  const listingAddress = normalizeText(listing.address)

  if (!matchesAdministrativeScope(listing, location)) return false

  if (selectedPostalCode && listingPostalCode && listingPostalCode !== selectedPostalCode) {
    return false
  }

  if (selectedStreetLabel) {
    const streetLabelMatch = listingStreetLabel
      ? (
        listingStreetLabel === selectedStreetLabel
        || listingStreetLabel.includes(selectedStreetLabel)
        || selectedStreetLabel.includes(listingStreetLabel)
      )
      : listingAddress.includes(selectedStreetLabel)

    if (!streetLabelMatch) return false
  }

  if (selectedStreetNumber) {
    return listingStreetNumber === selectedStreetNumber
  }

  return true
}

function matchesAddress(listing: ListingAddressRecord, location: LocationSuggestion) {
  const selectedLatitude = toFiniteNumber(location.latitude)
  const selectedLongitude = toFiniteNumber(location.longitude)
  const listingLatitude = toFiniteNumber(listing.latitude)
  const listingLongitude = toFiniteNumber(listing.longitude)

  if (
    selectedLatitude !== null
    && selectedLongitude !== null
    && listingLatitude !== null
    && listingLongitude !== null
  ) {
    const distanceKm = computeDistanceKm(
      selectedLatitude,
      selectedLongitude,
      listingLatitude,
      listingLongitude
    )

    if (distanceKm <= 0.8) return true
  }

  return matchesStreet(listing, location)
}

export function matchesLocation(listing: ListingAddressRecord, location: LocationSuggestion | null) {
  if (!location) return true
  if (!matchesCountry(listing, location)) return false

  if (location.type === 'region') {
    return matchesRegion(listing, location)
  }

  if (location.type === 'department') {
    return matchesDepartment(listing, location)
  }

  if (location.type === 'city') {
    return matchesCity(listing, location)
  }

  if (location.type === 'street') {
    return matchesStreet(listing, location)
  }

  return matchesAddress(listing, location)
}