<script setup lang="ts">
import { ref, toRef, watch } from 'vue'
import { useOverlayRoute } from '~/composables/useOverlayRoute'
import { useListingOverlayState } from '~/composables/useListingOverlayState'
import { useToast } from '~/composables/useToast'

const props = defineProps({
  slug: { type: String, required: true }
})

const modalRef = ref<{ scrollToTop: () => void } | null>(null)

const SWIPE_NAV_MIN_DISTANCE = 84
const SWIPE_NAV_MAX_VERTICAL_DRIFT = 72
const SWIPE_NAV_PREVIEW_MIN_DISTANCE = 20

const touchStartX = ref<number | null>(null)
const touchStartY = ref<number | null>(null)
const swipeTracking = ref(false)
const swipePreviewDirection = ref<'previous' | 'next' | null>(null)
const overlayRootRef = ref<HTMLElement | null>(null)
const slug = toRef(props, 'slug')

const { closeListing, isAuthOpen } = useOverlayRoute()
const { showComingSoonToast } = useToast()
const {
  error,
  handleToggleFavorite,
  initialLoading,
  isFavoriteListing,
  listing,
  loading,
  nextListingSlug,
  previousListingSlug,
  refreshing,
  goToNextListing,
  goToPreviousListing,
  weatherCity
} = useListingOverlayState(slug)

function handleListingClose() {
  if (isAuthOpen.value) return
  closeListing()
}

function handleAuthorProfileClick() {
  showComingSoonToast('Le profil de l\'hote')
}

function resetSwipeTracking() {
  touchStartX.value = null
  touchStartY.value = null
  swipeTracking.value = false
  swipePreviewDirection.value = null
}

function isMobileSwipeEnabled() {
  if (typeof window === 'undefined') {
    return false
  }
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches
}

function isInteractiveElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  return Boolean(target.closest('button, a, input, textarea, select, label, summary, [role="button"], [role="link"]'))
}

function getHorizontalScrollableAncestor(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return null
  }

  let node: HTMLElement | null = target
  while (node && node !== overlayRootRef.value) {
    const style = window.getComputedStyle(node)
    const canScrollX = /auto|scroll|overlay/.test(style.overflowX)
    const hasHorizontalOverflow = node.scrollWidth > node.clientWidth + 1

    if (canScrollX && hasHorizontalOverflow) {
      return node
    }

    node = node.parentElement
  }

  return null
}

function handleOverlayTouchStart(event: TouchEvent) {
  if (!isMobileSwipeEnabled() || event.touches.length !== 1 || loading.value || !!error.value || !listing.value) {
    resetSwipeTracking()
    return
  }

  if (isInteractiveElement(event.target)) {
    resetSwipeTracking()
    return
  }

  if (getHorizontalScrollableAncestor(event.target)) {
    // Let nested horizontal scrollers (weather strip, carousels, etc.) handle the gesture.
    resetSwipeTracking()
    return
  }

  const touch = event.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  swipeTracking.value = true
}

function handleOverlayTouchEnd(event: TouchEvent) {
  if (!swipeTracking.value || event.changedTouches.length === 0) {
    resetSwipeTracking()
    return
  }

  const startX = touchStartX.value
  const startY = touchStartY.value
  if (startX === null || startY === null) {
    resetSwipeTracking()
    return
  }

  const touch = event.changedTouches[0]
  const deltaX = touch.clientX - startX
  const deltaY = touch.clientY - startY
  const isHorizontalGesture = Math.abs(deltaX) >= SWIPE_NAV_MIN_DISTANCE && Math.abs(deltaY) <= SWIPE_NAV_MAX_VERTICAL_DRIFT

  if (!isHorizontalGesture) {
    resetSwipeTracking()
    return
  }

  resetSwipeTracking()

  if (deltaX > 0) {
    // Right swipe should open the listing on the right-side nav direction (previous button side).
    goToPreviousListing()
    return
  }

  goToNextListing()
}

function handleOverlayTouchMove(event: TouchEvent) {
  if (!swipeTracking.value || event.touches.length !== 1) {
    swipePreviewDirection.value = null
    return
  }

  const startX = touchStartX.value
  const startY = touchStartY.value
  if (startX === null || startY === null) {
    swipePreviewDirection.value = null
    return
  }

  const touch = event.touches[0]
  const deltaX = touch.clientX - startX
  const deltaY = touch.clientY - startY
  const isHorizontalEnough = Math.abs(deltaX) >= SWIPE_NAV_PREVIEW_MIN_DISTANCE
  const isWithinVerticalDrift = Math.abs(deltaY) <= SWIPE_NAV_MAX_VERTICAL_DRIFT

  if (!isHorizontalEnough || !isWithinVerticalDrift) {
    swipePreviewDirection.value = null
    return
  }

  swipePreviewDirection.value = deltaX > 0 ? 'previous' : 'next'
}

watch(
  slug,
  () => {
    modalRef.value?.scrollToTop()
  }
)
</script>

<template>
  <UiModalShell
    ref="modalRef"
    panel-class="listing-modal-panel"
    hide-header
    floating-close
    floating-close-label="Fermer l'annonce"
    scroll-on-panel
    full-bleed
    transparent-backdrop
    @close="handleListingClose"
  >
    <template #floating-actions>
      <UiPillButton
        class="listing-nav-btn"
        floating
        :class="{ 'listing-nav-btn--swipe-active': swipePreviewDirection === 'previous' }"
        :disabled="!previousListingSlug"
        @click="goToPreviousListing"
      >
        <template #leading>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </template>
        <span class="listing-nav-btn-label">Annonce précédente</span>
      </UiPillButton>

      <UiPillButton
        class="listing-nav-btn"
        floating
        :class="{ 'listing-nav-btn--swipe-active': swipePreviewDirection === 'next' }"
        :disabled="!nextListingSlug"
        @click="goToNextListing"
      >
        <span class="listing-nav-btn-label">Annonce suivante</span>
        <template #trailing>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </template>
      </UiPillButton>
    </template>

    <div
      ref="overlayRootRef"
      class="listing-overlay"
      @touchstart.passive="handleOverlayTouchStart"
      @touchmove.passive="handleOverlayTouchMove"
      @touchend.passive="handleOverlayTouchEnd"
      @touchcancel.passive="resetSwipeTracking"
    >
      <div v-if="initialLoading && !listing" class="overlay-state">
        <UiLoadingSpinner size="lg">Chargement du jardin...</UiLoadingSpinner>
      </div>

      <UiStatusState
        v-else-if="error && !listing"
        class="overlay-state"
        state="error"
        title="Jardin introuvable"
        message="Le serveur ne répond pas"
        fill
        min-height="calc(100dvh - var(--header-height))"
      />

      <template v-else-if="listing">
        <div class="listing-content-frame">
          <div class="listing-content" :class="{ 'is-refreshing': refreshing }">
            <ListingGallery :images="listing.images || []" :title="listing.title" />
            <ListingOverlayContent
              :listing="listing"
              :weather-city="weatherCity"
              :is-favorite="isFavoriteListing"
              @toggle-favorite="handleToggleFavorite"
              @author-profile-click="handleAuthorProfileClick"
            />
          </div>

          <div v-if="refreshing" class="overlay-refresh-state" aria-live="polite" aria-atomic="true">
            <UiLoadingSpinner size="md">Chargement de l'annonce...</UiLoadingSpinner>
          </div>
        </div>
      </template>
    </div>
  </UiModalShell>
</template>

<style scoped>
.listing-overlay {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 100%;
  overflow: visible;
}

.listing-content-frame {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 100%;
}

.listing-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 100%;
}

.listing-content.is-refreshing {
  pointer-events: none;
  user-select: none;
}

.overlay-state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: calc(100dvh - var(--header-height));
}

.overlay-state :deep(.loading-spinner) {
  width: 100%;
}

.overlay-refresh-state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: calc(var(--header-height) + 0.75rem) var(--page-gutter) 1rem;
  background: rgba(255, 255, 255, 0.52);
  z-index: 6;
}

.overlay-refresh-state :deep(.loading-spinner) {
  width: auto;
  min-width: min(100%, 18rem);
  padding: 0.75rem 1rem;
  border-radius: var(--btn-radius-pill);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: var(--shadow-sm);
}

.listing-nav-btn-label {
  font-weight: var(--font-weight-semi-bold);
}

.listing-nav-btn--swipe-active:not(:disabled) {
  background: #e8e9ec;
  border-color: #b0b3bc;
  color: var(--color-text);
}

@media (max-width: 768px) {
  .listing-nav-btn {
    --ui-button-height: var(--btn-height-touch);
    --ui-button-gap: 0;
    width: var(--btn-height-touch);
    padding: 0;
    justify-content: center;
  }

  .listing-nav-btn-label {
    display: none;
  }
}
</style>

<style>
.listing-modal-panel {
  --listing-overlay-scroll-track-top-offset: calc(var(--btn-height) + (var(--space-4) * 2));
  --ui-scroll-track-top-offset: var(--listing-overlay-scroll-track-top-offset);
  --ui-scroll-track-bottom-offset: 3rem;
}

@media (max-width: 1024px) {
  .listing-modal-panel {
    --ui-scroll-track-bottom-offset: calc(
      (var(--btn-height) * 2) + (var(--space-4) * 2) + 0.75rem + env(safe-area-inset-bottom)
    );
  }
}

@media (max-width: 768px) {
  .listing-modal-panel {
    --listing-overlay-scroll-track-top-offset: calc(var(--btn-height-touch) + (var(--space-3) * 2));
  }
}
</style>