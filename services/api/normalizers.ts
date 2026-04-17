import type {
  AuthSession,
  AuthUser,
  CreatedListingResponse,
  ListingAuthor,
  ListingAvailability,
  ListingAvailabilityException,
  ListingDateAvailability,
  ListingDateAvailabilityDetail,
  ListingDaySchedule,
  ListingDetails,
  ListingImage,
  ListingScheduleSlot,
  ListingsAvailabilityByDateResponse,
  ListingSummary,
  ListingTags,
  LocationSuggestion,
  LocationSuggestionFilter,
  LocationSuggestionType,
  UserListingSummary
} from '~/types/domain'

type ApiRecord = Record<string, unknown>

const LOCATION_SUGGESTION_TYPES = new Set<LocationSuggestionType>(['address', 'street', 'city', 'department', 'region'])
const AVATAR_FIELD_KEYS = [
  'avatar_url',
  'avatar',
  'profile_picture',
  'profile_picture_url',
  'profile_photo_url',
  'photo_url',
  'image_url'
] as const

function isApiRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasOwn(record: ApiRecord, key: string) {
  return Object.prototype.hasOwnProperty.call(record, key)
}

function getRecordValue(record: ApiRecord, keys: string[]) {
  for (const key of keys) {
    if (hasOwn(record, key)) {
      return record[key]
    }
  }

  return undefined
}

function toNullableString(value: unknown) {
  if (typeof value !== 'string') return null
  return value
}

function toRequiredString(value: unknown, fallback = '') {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return fallback
  return String(value)
}

function toNullableNumber(value: unknown) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function toBoolean(value: unknown) {
  return Boolean(value)
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => (typeof entry === 'string' ? entry : String(entry ?? '')))
    .filter((entry) => entry.length > 0)
}

function normalizeLocationSuggestionFilter(value: unknown): LocationSuggestionFilter {
  const record = isApiRecord(value) ? value : {}

  return {
    exactPhrases: toStringArray(record.exactPhrases),
    allTerms: toStringArray(record.allTerms),
    anyTerms: toStringArray(record.anyTerms)
  }
}

function normalizeLocationSuggestionType(value: unknown): LocationSuggestionType {
  if (typeof value === 'string' && LOCATION_SUGGESTION_TYPES.has(value as LocationSuggestionType)) {
    return value as LocationSuggestionType
  }

  return 'address'
}

export function normalizeLocationSuggestion(value: unknown): LocationSuggestion {
  const record = isApiRecord(value) ? value : {}

  return {
    id: toRequiredString(record.id),
    type: normalizeLocationSuggestionType(record.type),
    label: toRequiredString(record.label),
    displayLabel: toRequiredString(record.displayLabel, toRequiredString(record.label)),
    secondaryLabel: toRequiredString(record.secondaryLabel),
    city: toNullableString(record.city),
    postcode: toNullableString(record.postcode),
    department: toNullableString(record.department),
    departmentCode: toNullableString(record.departmentCode),
    region: toNullableString(record.region),
    regionCode: toNullableString(record.regionCode),
    cityInseeCode: toNullableString(record.cityInseeCode),
    streetNumber: toNullableString(record.streetNumber),
    streetLabel: toNullableString(record.streetLabel),
    countryCode: toNullableString(record.countryCode),
    latitude: toNullableNumber(record.latitude),
    longitude: toNullableNumber(record.longitude),
    matchTokens: toStringArray(record.matchTokens),
    filter: normalizeLocationSuggestionFilter(record.filter)
  }
}

function normalizeListingScheduleSlot(value: unknown): ListingScheduleSlot | null {
  if (!isApiRecord(value)) return null

  const openTime = toNullableString(value.LDT_open_time)
  const closeTime = toNullableString(value.LDT_close_time)

  if (!openTime || !closeTime) {
    return null
  }

  return {
    LDT_open_time: openTime,
    LDT_close_time: closeTime
  }
}

function normalizeListingScheduleSlots(value: unknown): ListingScheduleSlot[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => normalizeListingScheduleSlot(entry))
    .filter((entry): entry is ListingScheduleSlot => entry !== null)
}

function normalizeListingDaySchedule(value: unknown): ListingDaySchedule | null {
  if (!isApiRecord(value)) return null

  const dayOfWeek = toNullableNumber(value.day_of_week)
  if (dayOfWeek === null) return null

  return {
    day_of_week: dayOfWeek,
    is_open: toBoolean(value.is_open),
    hours: normalizeListingScheduleSlots(value.hours)
  }
}

function normalizeListingDaySchedules(value: unknown): ListingDaySchedule[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => normalizeListingDaySchedule(entry))
    .filter((entry): entry is ListingDaySchedule => entry !== null)
}

function normalizeListingDateAvailabilityDetail(value: unknown): ListingDateAvailabilityDetail | undefined {
  if (!isApiRecord(value)) return undefined

  const detail: ListingDateAvailabilityDetail = {}
  const label = toNullableString(value.label)
  const dayOfWeek = toNullableNumber(value.day_of_week)
  const startDate = toNullableString(value.LDT_start_date)
  const endDate = toNullableString(value.LDT_end_date)
  const hours = normalizeListingScheduleSlots(value.hours)

  if (label) detail.label = label
  if (dayOfWeek !== null) detail.day_of_week = dayOfWeek
  if (startDate) detail.LDT_start_date = startDate
  if (endDate) detail.LDT_end_date = endDate
  if (hours.length > 0) detail.hours = hours

  for (const [key, entryValue] of Object.entries(value)) {
    if (key === 'label' || key === 'day_of_week' || key === 'LDT_start_date' || key === 'LDT_end_date' || key === 'hours') {
      continue
    }

    detail[key] = entryValue
  }

  return Object.keys(detail).length > 0 ? detail : undefined
}

function normalizeListingDateAvailability(value: unknown, fallbackDate = ''): ListingDateAvailability {
  const record = isApiRecord(value) ? value : {}
  const status = record.status === 'open' ? 'open' : 'closed'

  return {
    date: toRequiredString(record.date, fallbackDate),
    status,
    reason: toRequiredString(record.reason, 'unknown'),
    detail: normalizeListingDateAvailabilityDetail(record.detail)
  }
}

function normalizeListingAuthor(value: unknown): ListingAuthor | null {
  if (!isApiRecord(value)) return null

  const id = toNullableNumber(value.id)
  if (id === null) return null

  return {
    id,
    display_name: toRequiredString(value.display_name)
  }
}

function normalizeListingTags(value: unknown): ListingTags {
  if (!isApiRecord(value)) return {}

  const tags: ListingTags = {}

  for (const [key, entryValue] of Object.entries(value)) {
    tags[key] = toStringArray(entryValue)
  }

  return tags
}

function normalizeListingImage(value: unknown): ListingImage | null {
  if (!isApiRecord(value)) return null

  const url = toNullableString(value.url)
  if (!url) return null

  return {
    url,
    position: toNullableNumber(value.position) ?? 0
  }
}

function normalizeListingImages(value: unknown): ListingImage[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => normalizeListingImage(entry))
    .filter((entry): entry is ListingImage => entry !== null)
}

function normalizeListingAvailabilityException(value: unknown): ListingAvailabilityException | null {
  if (!isApiRecord(value)) return null

  const id = toNullableNumber(value.id)
  const startDate = toNullableString(value.LDT_start_date)
  const endDate = toNullableString(value.LDT_end_date)

  if (id === null || !startDate || !endDate) {
    return null
  }

  return {
    id,
    LDT_start_date: startDate,
    LDT_end_date: endDate,
    is_open: toBoolean(value.is_open),
    label: toNullableString(value.label),
    hours: normalizeListingScheduleSlots(value.hours)
  }
}

function normalizeListingAvailability(value: unknown): ListingAvailability | null {
  if (!isApiRecord(value)) return null

  const settingsRecord = isApiRecord(value.settings) ? value.settings : {}
  const weeklyRules = Array.isArray(value.weekly_rules)
    ? value.weekly_rules
      .map((entry) => {
        if (!isApiRecord(entry)) return null

        const dayOfWeek = toNullableNumber(entry.day_of_week)
        if (dayOfWeek === null) return null

        return {
          day_of_week: dayOfWeek,
          is_open: toBoolean(entry.is_open)
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    : []

  const weeklyHours = Array.isArray(value.weekly_hours)
    ? value.weekly_hours
      .map((entry) => {
        if (!isApiRecord(entry)) return null

        const scheduleSlot = normalizeListingScheduleSlot(entry)
        const dayOfWeek = toNullableNumber(entry.day_of_week)

        if (!scheduleSlot || dayOfWeek === null) return null

        return {
          id: toNullableNumber(entry.id) ?? undefined,
          day_of_week: dayOfWeek,
          ...scheduleSlot
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    : []

  const exceptions = Array.isArray(value.exceptions)
    ? value.exceptions
      .map((entry) => normalizeListingAvailabilityException(entry))
      .filter((entry): entry is ListingAvailabilityException => entry !== null)
    : []

  return {
    settings: {
      default_is_open: toBoolean(settingsRecord.default_is_open),
      exclude_public_holidays: toBoolean(settingsRecord.exclude_public_holidays)
    },
    default_hours: normalizeListingScheduleSlots(value.default_hours),
    weekly_rules: weeklyRules,
    weekly_hours: weeklyHours,
    exceptions
  }
}

export function normalizeListingSummaryRecord(value: unknown): ListingSummary {
  const record = isApiRecord(value) ? value : {}

  return {
    id: toRequiredString(record.id),
    title: toRequiredString(record.title),
    slug: toRequiredString(record.slug),
    price_cents: toNullableNumber(record.price_cents) ?? 0,
    currency: toRequiredString(record.currency),
    address: toRequiredString(getRecordValue(record, ['address', 'ADDRESS_LABEL'])),
    latitude: toNullableNumber(getRecordValue(record, ['latitude', 'ADDRESS_LATITUDE'])),
    longitude: toNullableNumber(getRecordValue(record, ['longitude', 'ADDRESS_LONGITUDE'])),
    address_city_insee_code: toNullableString(getRecordValue(record, ['address_city_insee_code', 'ADDRESS_CITY_INSEE_CODE'])),
    address_department_code: toNullableString(getRecordValue(record, ['address_department_code', 'ADDRESS_DEPARTMENT_CODE'])),
    address_region_code: toNullableString(getRecordValue(record, ['address_region_code', 'ADDRESS_REGION_CODE'])),
    address_country_code: toNullableString(getRecordValue(record, ['address_country_code', 'ADDRESS_COUNTRY_CODE'])),
    address_street_number: toNullableString(getRecordValue(record, ['address_street_number', 'ADDRESS_STREET_NUMBER', 'ADRESS_STREET_NUMBER', 'adress_street_number'])),
    address_street_label: toNullableString(getRecordValue(record, ['address_street_label', 'ADDRESS_STREET_LABEL', 'ADRESS_STREET_LABEL', 'adress_street_label'])),
    address_postal_code: toNullableString(getRecordValue(record, ['address_postal_code', 'ADDRESS_POSTAL_CODE', 'ADRESS_POSTAL_CODE', 'adress_postal_code'])),
    area_m2: toNullableNumber(record.area_m2) ?? 0,
    capacity: toNullableNumber(record.capacity) ?? 0,
    animals_allowed: toBoolean(record.animals_allowed),
    thumbnail: toNullableString(record.thumbnail),
    author: normalizeListingAuthor(record.author),
    tags: normalizeListingTags(record.tags),
    effective_schedule: normalizeListingDaySchedules(record.effective_schedule),
    exclude_public_holidays: toBoolean(record.exclude_public_holidays),
    UTC_created_at: toNullableString(getRecordValue(record, ['UTC_created_at', 'created_at']))
  }
}

export function normalizeListingDetailsRecord(value: unknown): ListingDetails {
  const record = isApiRecord(value) ? value : {}
  const summary = normalizeListingSummaryRecord(record)

  return {
    ...summary,
    description: toNullableString(record.description),
    timezone: toRequiredString(record.timezone, 'Europe/Paris'),
    water_point: toBoolean(record.water_point),
    night_lighting: toBoolean(record.night_lighting),
    wheelchair_accessible: toBoolean(record.wheelchair_accessible),
    deposit_cents: toNullableNumber(record.deposit_cents),
    cancellation_policy: toNullableString(record.cancellation_policy),
    created_at: toNullableString(getRecordValue(record, ['created_at', 'UTC_created_at'])),
    images: normalizeListingImages(record.images),
    availability: normalizeListingAvailability(record.availability)
  }
}

export function normalizeAuthUser(value: unknown): AuthUser {
  const record = isApiRecord(value) ? value : {}
  const normalizedUser: AuthUser = {
    id: toNullableNumber(record.id) ?? 0,
    display_name: toRequiredString(record.display_name),
    email: toRequiredString(record.email),
    UTC_created_at: toNullableString(getRecordValue(record, ['UTC_created_at', 'created_at']))
  }

  for (const key of AVATAR_FIELD_KEYS) {
    const valueForKey = toNullableString(record[key])
    if (valueForKey !== null) {
      normalizedUser[key] = valueForKey
    }
  }

  return normalizedUser
}

export function normalizeAuthSession(value: unknown): AuthSession {
  const record = isApiRecord(value) ? value : {}

  return {
    token: toRequiredString(record.token),
    user: normalizeAuthUser(record.user)
  }
}

export function normalizeCreatedListingResponse(value: unknown): CreatedListingResponse {
  const record = isApiRecord(value) ? value : {}

  return {
    id: toRequiredString(record.id),
    slug: toRequiredString(record.slug)
  }
}

export function normalizeUserListingSummary(value: unknown): UserListingSummary | null {
  if (!isApiRecord(value)) return null

  return {
    id: toRequiredString(value.id),
    title: toRequiredString(value.title),
    slug: toRequiredString(value.slug),
    price_cents: toNullableNumber(value.price_cents) ?? 0,
    currency: toRequiredString(value.currency),
    address: toRequiredString(getRecordValue(value, ['address', 'ADDRESS_LABEL'])),
    area_m2: toNullableNumber(value.area_m2) ?? 0,
    capacity: toNullableNumber(value.capacity) ?? 0
  }
}

export function normalizeAvailabilityByDateResponse(value: unknown, requestedDate: string): ListingsAvailabilityByDateResponse {
  const record = isApiRecord(value) ? value : {}
  const availabilityRecord = isApiRecord(record.availabilities) ? record.availabilities : {}
  const availabilities: Record<string, ListingDateAvailability> = {}

  for (const [listingId, availability] of Object.entries(availabilityRecord)) {
    availabilities[listingId] = normalizeListingDateAvailability(availability, requestedDate)
  }

  return {
    date: toRequiredString(record.date, requestedDate),
    availabilities
  }
}