export type LocationSuggestionType = 'address' | 'street' | 'city' | 'department' | 'region'

export interface LocationSuggestionFilter {
  exactPhrases: string[]
  allTerms: string[]
  anyTerms: string[]
}

export interface LocationSuggestion {
  id: string
  type: LocationSuggestionType
  label: string
  displayLabel: string
  secondaryLabel: string
  city: string | null
  postcode: string | null
  department: string | null
  departmentCode: string | null
  region: string | null
  regionCode: string | null
  cityInseeCode: string | null
  streetNumber: string | null
  streetLabel: string | null
  countryCode: string | null
  latitude: number | null
  longitude: number | null
  matchTokens: string[]
  filter: LocationSuggestionFilter
}

export interface ListingScheduleSlot {
  LDT_open_time: string
  LDT_close_time: string
}

export interface ListingDaySchedule {
  day_of_week: number
  is_open: boolean
  hours: ListingScheduleSlot[]
}

export interface ListingDateAvailabilityDetail {
  label?: string
  day_of_week?: number
  LDT_start_date?: string
  LDT_end_date?: string
  hours?: ListingScheduleSlot[]
  [key: string]: unknown
}

export interface ListingDateAvailability {
  date: string
  status: 'open' | 'closed'
  reason: string
  detail?: ListingDateAvailabilityDetail
}

export interface ListingAuthor {
  id: number
  display_name: string
}

export interface ListingTags {
  equipment?: string[]
  event?: string[]
  [key: string]: string[] | undefined
}

export interface ListingImage {
  url: string
  position: number
}

export interface ListingAvailabilitySettings {
  default_is_open: boolean
  exclude_public_holidays: boolean
}

export interface ListingWeeklyRule {
  day_of_week: number
  is_open: boolean
}

export interface ListingWeeklyHoursEntry extends ListingScheduleSlot {
  id?: number
  day_of_week: number
}

export interface ListingAvailabilityException {
  id: number
  LDT_start_date: string
  LDT_end_date: string
  is_open: boolean
  label: string | null
  hours: ListingScheduleSlot[]
}

export interface ListingAvailability {
  settings: ListingAvailabilitySettings
  default_hours: ListingScheduleSlot[]
  weekly_rules: ListingWeeklyRule[]
  weekly_hours: ListingWeeklyHoursEntry[]
  exceptions: ListingAvailabilityException[]
}

export interface ListingSummary {
  id: string
  title: string
  slug: string
  price_cents: number
  currency: string
  address: string
  latitude: number | null
  longitude: number | null
  address_city_insee_code: string | null
  address_department_code: string | null
  address_region_code: string | null
  address_country_code: string | null
  address_street_number: string | null
  address_street_label: string | null
  address_postal_code: string | null
  area_m2: number
  capacity: number
  animals_allowed: boolean
  thumbnail: string | null
  author: ListingAuthor | null
  tags: ListingTags
  effective_schedule: ListingDaySchedule[]
  exclude_public_holidays: boolean
  UTC_created_at: string | null
}

export interface ListingDetails extends ListingSummary {
  description: string | null
  timezone: string
  water_point: boolean
  night_lighting: boolean
  wheelchair_accessible: boolean
  deposit_cents: number | null
  cancellation_policy: string | null
  created_at: string | null
  images: ListingImage[]
  availability: ListingAvailability | null
}

export interface ListingsAvailabilityByDateResponse {
  date: string
  availabilities: Record<string, ListingDateAvailability>
}

export interface AuthUser {
  id: number
  display_name: string
  email: string
  UTC_created_at: string | null
  avatar_url?: string | null
  avatar?: string | null
  profile_picture?: string | null
  profile_picture_url?: string | null
  profile_photo_url?: string | null
  photo_url?: string | null
  image_url?: string | null
  [key: string]: unknown
}

export interface AuthSession {
  token: string
  user: AuthUser
}

export interface UserListingSummary {
  id: string
  title: string
  slug: string
  price_cents: number
  currency: string
  address: string
  area_m2: number
  capacity: number
}

export interface CreatedListingResponse {
  id: string
  slug: string
}

export type ListingSortField = 'price_cents' | 'area_m2' | 'capacity' | 'UTC_created_at'

export type ListingSortOrder = 'asc' | 'desc'

export interface CatalogFiltersState {
  minArea: number
  maxPrice: number
  selectedEquipment: string[]
  selectedEvents: string[]
  animalsOnly: boolean
  selectedDays: number[]
  timeFrom: string
  timeTo: string
  publicHolidaysOnly: boolean
}

export interface CatalogFilterOptions {
  availableEquipment: string[]
  availableEvents: string[]
}