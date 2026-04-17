// ============================================
// services/api.ts - Public API facade
// Keeps the existing import surface while delegating by domain.
// ============================================

export type {
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

export { fetchUserProfile, loginUser, logoutUser, registerUser } from './api/auth'
export {
  createListing,
  fetchAllListings,
  fetchListingBySlug,
  fetchListingsAvailabilityByDate,
  fetchLocationSuggestions,
  fetchUserListings
} from './api/listings'
export { COOKIE_SESSION_TOKEN, resolveApiAssetUrl } from './api/runtime'
