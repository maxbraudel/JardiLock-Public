<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { resolveApiAssetUrl } from '../../services/api'
import { useOverlayRoute } from '../../composables/useOverlayRoute'

type GalleryImage = {
  url: string
  position: number
  resolvedUrl: string
  originalIndex: number
}

const props = defineProps({
  images: { type: Array as () => { url: string; position: number }[], required: true },
  title: { type: String, default: '' }
})

const isMobile = ref(false)
const lightboxIndex = ref(0)
const lightboxStageRef = ref<HTMLElement | null>(null)
const lightboxTouchStartX = ref<number | null>(null)
const lightboxTouchStartY = ref<number | null>(null)
const lightboxTouchStartTimeMs = ref<number | null>(null)
const lightboxTouchAxis = ref<'x' | 'y' | null>(null)
const lightboxSwipeOffsetX = ref(0)
const lightboxSwipeShift = ref<-1 | 0 | 1>(0)
const lightboxIsSwipeDragging = ref(false)
const lightboxIsSwipeAnimating = ref(false)
const lightboxSwipePreviewDirection = ref<'previous' | 'next' | null>(null)

const {
  isViewerOpen,
  viewerImageIndex,
  openGalleryViewer,
  closeViewer,
  setViewerImageIndex
} = useOverlayRoute()

const isLightboxOpen = computed(() => isViewerOpen.value)

const LIGHTBOX_SWIPE_THRESHOLD_PX = 46
const LIGHTBOX_SWIPE_AXIS_LOCK_PX = 10
const LIGHTBOX_FAST_SWIPE_MIN_DISTANCE_PX = 24
const LIGHTBOX_FAST_SWIPE_MAX_DURATION_MS = 180
const LIGHTBOX_SWIPE_PREVIEW_PX = 20
const LIGHTBOX_TRACK_STEP_PERCENT = 100 / 3
const LIGHTBOX_TRACK_CENTER_PERCENT = -LIGHTBOX_TRACK_STEP_PERCENT

const resolvedImages = computed<GalleryImage[]>(() => {
  return props.images.map((image, index) => ({
    ...image,
    resolvedUrl: resolveApiAssetUrl(image.url),
    originalIndex: index
  }))
})

const primaryImage = computed(() => resolvedImages.value[0] || null)
const sideImages = computed(() => resolvedImages.value.slice(1, 5))
const hiddenImagesCount = computed(() => Math.max(0, resolvedImages.value.length - 5))
const lightboxImage = computed(() => resolvedImages.value[lightboxIndex.value] || null)
const hasMultipleImages = computed(() => resolvedImages.value.length > 1)
const previousLightboxIndex = computed(() => {
  const count = resolvedImages.value.length
  if (!count) return 0
  return (lightboxIndex.value - 1 + count) % count
})
const nextLightboxIndex = computed(() => {
  const count = resolvedImages.value.length
  if (!count) return 0
  return (lightboxIndex.value + 1) % count
})
const previousLightboxImage = computed(() => resolvedImages.value[previousLightboxIndex.value] || lightboxImage.value)
const nextLightboxImage = computed(() => resolvedImages.value[nextLightboxIndex.value] || lightboxImage.value)
const lightboxShouldAnimateTrack = computed(() => {
  return (
    lightboxIsSwipeAnimating.value ||
    (!lightboxIsSwipeDragging.value && Math.abs(lightboxSwipeOffsetX.value) > 0.5)
  )
})
const lightboxSwipeTrackStyle = computed(() => {
  const baseShiftPercent = LIGHTBOX_TRACK_CENTER_PERCENT - lightboxSwipeShift.value * LIGHTBOX_TRACK_STEP_PERCENT
  const gapMultiplier = -(1 + lightboxSwipeShift.value)
  const translateX = `calc(${baseShiftPercent}% + (${gapMultiplier} * var(--page-gutter)) + ${lightboxSwipeOffsetX.value}px)`

  return {
    transform: `translate3d(${translateX}, 0, 0)`
  }
})

const galleryCountClass = computed(() => {
  const count = resolvedImages.value.length
  if (count === 0) return ''
  if (count === 1) return 'gallery-count-1'
  if (count === 2) return 'gallery-count-2'
  if (count === 3) return 'gallery-count-3'
  if (count === 4) return 'gallery-count-4'
  return 'gallery-count-5'
})

function updateViewport() {
  isMobile.value = window.innerWidth < 768
}

function openLightbox(index = 0) {
  if (!resolvedImages.value.length) return
  const nextIndex = Math.min(Math.max(index, 0), resolvedImages.value.length - 1)
  lightboxIndex.value = nextIndex
  lightboxSwipeShift.value = 0
  lightboxSwipeOffsetX.value = 0
  lightboxIsSwipeAnimating.value = false
  lightboxIsSwipeDragging.value = false
  resetLightboxTouch()
  openGalleryViewer(nextIndex)
}

function closeLightbox() {
  lightboxSwipeShift.value = 0
  lightboxSwipeOffsetX.value = 0
  lightboxIsSwipeAnimating.value = false
  lightboxIsSwipeDragging.value = false
  resetLightboxTouch()

  if (isViewerOpen.value) {
    closeViewer()
  }
}

function showPreviousImage(force = false) {
  if (!resolvedImages.value.length) return

  if (!force && hasMultipleImages.value) {
    if (lightboxIsSwipeAnimating.value) {
      interruptAndCommitAnimatingSwipe()
    }

    animateSwipeTo(-1)
    return
  }

  lightboxIndex.value = (lightboxIndex.value - 1 + resolvedImages.value.length) % resolvedImages.value.length
}

function showNextImage(force = false) {
  if (!resolvedImages.value.length) return

  if (!force && hasMultipleImages.value) {
    if (lightboxIsSwipeAnimating.value) {
      interruptAndCommitAnimatingSwipe()
    }

    animateSwipeTo(1)
    return
  }

  lightboxIndex.value = (lightboxIndex.value + 1) % resolvedImages.value.length
}

function getLightboxAlt(photoIndex: number) {
  return `${props.title} — photo ${photoIndex + 1}`
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function resetLightboxTouch() {
  lightboxTouchStartX.value = null
  lightboxTouchStartY.value = null
  lightboxTouchStartTimeMs.value = null
  lightboxTouchAxis.value = null
  lightboxSwipePreviewDirection.value = null
}

function getLightboxMaxSwipeDistance() {
  const stageWidth = lightboxStageRef.value?.clientWidth || window.innerWidth || 320
  return Math.max(80, Math.round(stageWidth * 0.5))
}

function animateSwipeTo(direction: -1 | 1) {
  if (lightboxIsSwipeAnimating.value) return
  lightboxSwipeShift.value = direction
  lightboxSwipeOffsetX.value = 0
  lightboxIsSwipeDragging.value = false
  lightboxIsSwipeAnimating.value = true
}

function snapSwipeBack() {
  const hasOffsetToRestore = Math.abs(lightboxSwipeOffsetX.value) > 0.5

  lightboxSwipeShift.value = 0
  lightboxIsSwipeDragging.value = false

  if (!hasOffsetToRestore) {
    lightboxSwipeOffsetX.value = 0
    lightboxIsSwipeAnimating.value = false
    return
  }

  lightboxIsSwipeAnimating.value = true
  lightboxSwipeOffsetX.value = 0
}

function handleLightboxTrackTransitionEnd(event: TransitionEvent) {
  if (event.propertyName !== 'transform') return
  if (!lightboxIsSwipeAnimating.value) return

  const direction = lightboxSwipeShift.value

  if (direction === 1) {
    showNextImage(true)
  } else if (direction === -1) {
    showPreviousImage(true)
  }

  lightboxIsSwipeAnimating.value = false
  lightboxIsSwipeDragging.value = false
  lightboxSwipeShift.value = 0
  lightboxSwipeOffsetX.value = 0
}

function interruptAndCommitAnimatingSwipe() {
  if (!lightboxIsSwipeAnimating.value) return

  const direction = lightboxSwipeShift.value
  lightboxIsSwipeAnimating.value = false
  lightboxIsSwipeDragging.value = false
  lightboxSwipeShift.value = 0
  lightboxSwipeOffsetX.value = 0

  if (direction === 1) {
    showNextImage(true)
  } else if (direction === -1) {
    showPreviousImage(true)
  }
}

function handleLightboxTouchStart(event: TouchEvent) {
  if (!isMobile.value || !isLightboxOpen.value || !hasMultipleImages.value) return

  // Allow fast chained swipes: commit any in-flight animation first.
  interruptAndCommitAnimatingSwipe()

  if (event.touches.length !== 1) {
    snapSwipeBack()
    resetLightboxTouch()
    return
  }

  const touch = event.touches[0]
  lightboxTouchStartX.value = touch.clientX
  lightboxTouchStartY.value = touch.clientY
  lightboxTouchStartTimeMs.value = performance.now()
  lightboxTouchAxis.value = null
  lightboxSwipeOffsetX.value = 0
  lightboxSwipeShift.value = 0
  lightboxIsSwipeDragging.value = true
}

function handleLightboxTouchMove(event: TouchEvent) {
  if (!isMobile.value || !isLightboxOpen.value || !hasMultipleImages.value) return
  if (lightboxTouchStartX.value === null || lightboxTouchStartY.value === null) return
  if (event.touches.length !== 1) return

  const touch = event.touches[0]
  const deltaX = touch.clientX - lightboxTouchStartX.value
  const deltaY = touch.clientY - lightboxTouchStartY.value

  if (!lightboxTouchAxis.value) {
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (absX < LIGHTBOX_SWIPE_AXIS_LOCK_PX && absY < LIGHTBOX_SWIPE_AXIS_LOCK_PX) {
      return
    }

    lightboxTouchAxis.value = absX > absY ? 'x' : 'y'
  }

  if (lightboxTouchAxis.value !== 'x') return

  if (Math.abs(deltaX) >= LIGHTBOX_SWIPE_PREVIEW_PX && Math.abs(deltaX) > Math.abs(deltaY)) {
    lightboxSwipePreviewDirection.value = deltaX > 0 ? 'previous' : 'next'
  } else {
    lightboxSwipePreviewDirection.value = null
  }

  if (Math.abs(deltaX) > Math.abs(deltaY) + 8 && event.cancelable) {
    event.preventDefault()
  }

  const maxDistance = getLightboxMaxSwipeDistance()
  lightboxSwipeOffsetX.value = clamp(deltaX, -maxDistance, maxDistance)
}

function handleLightboxTouchEnd(event: TouchEvent) {
  if (!isMobile.value || !isLightboxOpen.value || !hasMultipleImages.value) {
    resetLightboxTouch()
    return
  }

  if (lightboxTouchStartX.value === null || lightboxTouchStartY.value === null) {
    resetLightboxTouch()
    return
  }

  const touch = event.changedTouches[0]
  if (!touch) {
    resetLightboxTouch()
    return
  }

  const deltaX = touch.clientX - lightboxTouchStartX.value
  const deltaY = touch.clientY - lightboxTouchStartY.value
  const elapsedMs =
    typeof lightboxTouchStartTimeMs.value === 'number'
      ? performance.now() - lightboxTouchStartTimeMs.value
      : Number.POSITIVE_INFINITY

  const isFastSwipe =
    elapsedMs <= LIGHTBOX_FAST_SWIPE_MAX_DURATION_MS &&
    Math.abs(deltaX) >= LIGHTBOX_FAST_SWIPE_MIN_DISTANCE_PX &&
    Math.abs(deltaX) > Math.abs(deltaY)

  if (
    lightboxTouchAxis.value === 'x' &&
    ((Math.abs(deltaX) >= LIGHTBOX_SWIPE_THRESHOLD_PX && Math.abs(deltaX) > Math.abs(deltaY)) || isFastSwipe)
  ) {
    animateSwipeTo(deltaX < 0 ? 1 : -1)
  } else {
    snapSwipeBack()
  }

  resetLightboxTouch()
}

function handleLightboxTouchCancel() {
  snapSwipeBack()
  resetLightboxTouch()
}

function handleKeydown(event: KeyboardEvent) {
  if (!isLightboxOpen.value) return

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    showPreviousImage()
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    showNextImage()
  }
}

watch(
  () => props.images.length,
  (length) => {
    if (length === 0) {
      lightboxIndex.value = 0
      closeLightbox()
      return
    }

    if (lightboxIndex.value > length - 1) {
      lightboxIndex.value = 0
    }
  }
)

watch(
  [isViewerOpen, viewerImageIndex, () => resolvedImages.value.length],
  ([viewerOpen, hashImageIndex, imageCount]) => {
    if (!viewerOpen) {
      return
    }

    if (!imageCount) {
      closeLightbox()
      return
    }

    const targetIndex =
      typeof hashImageIndex === 'number'
        ? clamp(hashImageIndex, 0, imageCount - 1)
        : 0

    if (lightboxIndex.value !== targetIndex) {
      lightboxIndex.value = targetIndex
    }
  },
  { immediate: true }
)

watch(lightboxIndex, (index) => {
  if (!isViewerOpen.value) return
  setViewerImageIndex(index)
})

onMounted(() => {
  updateViewport()
  window.addEventListener('resize', updateViewport)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="listing-gallery">
    <div v-if="resolvedImages.length === 0" class="gallery-placeholder">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/></svg>
      <p>Aucune image disponible</p>
    </div>

    <template v-else>
      <div v-if="!isMobile" class="gallery-desktop-view">
        <div class="gallery-grid" :class="galleryCountClass">
          <button class="gallery-tile gallery-tile-main" type="button" @click="openLightbox(0)">
            <img
              :src="primaryImage?.resolvedUrl"
              :alt="`${title} — photo 1`"
              class="gallery-image"
            />
          </button>

          <div v-if="sideImages.length > 0" class="gallery-side">
            <button
              v-for="(image, index) in sideImages"
              :key="`${image.originalIndex}-${image.url}`"
              class="gallery-tile gallery-tile-side"
              type="button"
              @click="openLightbox(image.originalIndex)"
            >
              <img
                :src="image.resolvedUrl"
                :alt="`${title} — photo ${image.originalIndex + 1}`"
                class="gallery-image"
              />
              <span
                v-if="index === sideImages.length - 1 && hiddenImagesCount > 0"
                class="gallery-more-badge"
              >
                +{{ hiddenImagesCount }}
              </span>
            </button>
          </div>
        </div>

        <UiPillButton v-if="resolvedImages.length > 1" type="button" variant="surface-dark" floating class="gallery-show-all-btn" @click="openLightbox(0)">
          <template #leading>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" fill="currentColor"/></svg>
          </template>
          Voir les images ({{ resolvedImages.length }})
        </UiPillButton>
      </div>

      <div v-else class="gallery-mobile-view">
        <button class="gallery-mobile-frame" type="button" @click="openLightbox(0)">
          <img
            :src="primaryImage?.resolvedUrl"
            :alt="`${title} — photo 1`"
            class="gallery-image gallery-image-mobile"
          />
        </button>

        <UiPillButton v-if="resolvedImages.length > 1" type="button" variant="surface-dark" floating class="gallery-show-all-btn" @click="openLightbox(0)">
          <template #leading>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" fill="currentColor"/></svg>
          </template>
          Voir les images ({{ resolvedImages.length }})
        </UiPillButton>
      </div>
    </template>

    <UiModalShell
      v-if="isLightboxOpen && lightboxImage"
      :title="title"
      panel-class="gallery-lightbox-panel"
      :use-scroll-container="false"
      full-bleed
      cover-viewport
      hide-header
      floating-close
      floating-close-label="Fermer"
      floating-close-responsive-icon-only
      floating-close-variant="surface-dark"
      @close="closeLightbox"
    >
      <div class="gallery-lightbox">
        <UiIconButton
          v-if="hasMultipleImages && !isMobile"
          variant="surface-dark"
          size="md"
          :class="[
            'gallery-lightbox-nav gallery-lightbox-nav-left',
            { 'gallery-lightbox-nav-btn--swipe-active': lightboxSwipePreviewDirection === 'previous' }
          ]"
          aria-label="Image précédente"
          @click="showPreviousImage"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </UiIconButton>

        <div
          ref="lightboxStageRef"
          class="gallery-lightbox-stage"
          @touchstart="handleLightboxTouchStart"
          @touchmove="handleLightboxTouchMove"
          @touchend="handleLightboxTouchEnd"
          @touchcancel="handleLightboxTouchCancel"
        >
          <div v-if="hasMultipleImages && isMobile" class="gallery-lightbox-mobile-nav">
            <UiIconButton
              variant="surface-dark"
              size="md"
              :class="[
                'gallery-lightbox-mobile-nav-btn',
                { 'gallery-lightbox-nav-btn--swipe-active': lightboxSwipePreviewDirection === 'previous' }
              ]"
              aria-label="Image précédente"
              @click="showPreviousImage"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </UiIconButton>

            <UiIconButton
              variant="surface-dark"
              size="md"
              :class="[
                'gallery-lightbox-mobile-nav-btn',
                { 'gallery-lightbox-nav-btn--swipe-active': lightboxSwipePreviewDirection === 'next' }
              ]"
              aria-label="Image suivante"
              @click="showNextImage"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </UiIconButton>
          </div>

          <div class="gallery-lightbox-swipe-viewport">
            <div
              class="gallery-lightbox-swipe-track"
              :class="{ 'is-animating': lightboxShouldAnimateTrack }"
              :style="lightboxSwipeTrackStyle"
              @transitionend="handleLightboxTrackTransitionEnd"
            >
              <div class="gallery-lightbox-swipe-slide">
                <img
                  :src="previousLightboxImage?.resolvedUrl || lightboxImage.resolvedUrl"
                  :alt="getLightboxAlt(previousLightboxIndex)"
                  class="gallery-lightbox-image"
                />
              </div>

              <div class="gallery-lightbox-swipe-slide">
                <img
                  :src="lightboxImage.resolvedUrl"
                  :alt="getLightboxAlt(lightboxIndex)"
                  class="gallery-lightbox-image"
                />
              </div>

              <div class="gallery-lightbox-swipe-slide">
                <img
                  :src="nextLightboxImage?.resolvedUrl || lightboxImage.resolvedUrl"
                  :alt="getLightboxAlt(nextLightboxIndex)"
                  class="gallery-lightbox-image"
                />
              </div>
            </div>
          </div>
        </div>

        <UiIconButton
          v-if="hasMultipleImages && !isMobile"
          variant="surface-dark"
          size="md"
          :class="[
            'gallery-lightbox-nav gallery-lightbox-nav-right',
            { 'gallery-lightbox-nav-btn--swipe-active': lightboxSwipePreviewDirection === 'next' }
          ]"
          aria-label="Image suivante"
          @click="showNextImage"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </UiIconButton>

        <div class="gallery-lightbox-footer">
          <UiFloatingTextLabel class="gallery-lightbox-footer-counter">
            {{ lightboxIndex + 1 }} / {{ resolvedImages.length }}
          </UiFloatingTextLabel>
          <UiFloatingTextLabel v-if="title" class="gallery-lightbox-footer-title">
            {{ title }}
          </UiFloatingTextLabel>
        </div>
      </div>
    </UiModalShell>
  </div>
</template>

<style scoped>
.listing-gallery {
  width: 100%;
  position: relative;
}

.gallery-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  background: var(--color-bg-dark);
  border-radius: 4px 4px 0 0;
  color: var(--color-text-muted);
}

.gallery-placeholder p {
  margin-top: var(--space-2);
  font-size: 1rem;
}

/* Gallery grid layouts based on image count */
.gallery-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
  overflow: hidden;
  height: 500px;
}

.gallery-side {
  display: grid;
  gap: 4px;
  min-height: 0;
}

.gallery-tile {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  overflow: hidden;
  background: var(--color-bg-dark);
  cursor: pointer;
  min-height: 0;
}

.gallery-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.gallery-more-badge {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  color: white;
  font-size: 1.2rem;
  font-weight: 700;
}

/* "Voir les images" button */
.gallery-show-all-btn {
  position: absolute;
  bottom: 1rem;
  right: var(--page-gutter-safe-inline-end);
}

.gallery-show-all-btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Mobile */
.gallery-mobile-frame {
  display: block;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  background: var(--color-bg-dark);
  width: 100%;
  padding: 0;
  border: 0;
  line-height: 0;
  cursor: pointer;
}

.gallery-mobile-view {
  position: relative;
}

.gallery-image-mobile {
  min-height: 280px;
  max-height: 320px;
}

.gallery-lightbox {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 0;
  background: #06080c;
}

.gallery-lightbox-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  padding-bottom: calc(var(--space-7) + 2.25rem);
  position: relative;
}

.gallery-lightbox-swipe-viewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.gallery-lightbox-swipe-track {
  display: flex;
  width: 300%;
  height: 100%;
  gap: var(--page-gutter);
  will-change: transform;
}

.gallery-lightbox-swipe-track.is-animating {
  transition: transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1) !important;
}

.gallery-lightbox-swipe-slide {
  flex: 0 0 33.333333%;
  width: 33.333333%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery-lightbox-image {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.4);
}

.gallery-lightbox-nav {
  position: absolute;
  top: 50%;
  z-index: 2;
  transform: translateY(-50%);
}

.gallery-lightbox-nav svg {
  width: 18px;
  height: 18px;
}

.gallery-lightbox-nav-left {
  left: var(--page-gutter-safe-inline-start);
}

.gallery-lightbox-nav-right {
  right: var(--page-gutter-safe-inline-end);
}

.gallery-lightbox-footer {
  position: absolute;
  left: var(--page-gutter-safe-inline-start);
  right: var(--page-gutter-safe-inline-end);
  bottom: var(--space-4);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-start;
  column-gap: 1rem;
  row-gap: 0.5rem;
  color: white;
  container-type: inline-size;
}

.gallery-lightbox-footer-counter {
  flex: 0 0 auto;
}

.gallery-lightbox-footer-title {
  flex: 0 1 auto;
  min-width: 0;
  margin-left: auto;
  max-width: min(68ch, 65vw);
  text-align: right;
  white-space: nowrap;
}

@container (max-width: 34rem) {
  .gallery-lightbox-footer {
    align-items: flex-start;
  }

  .gallery-lightbox-footer-title {
    flex-basis: 100%;
    margin-left: 0;
    max-width: 100%;
    text-align: left;
    white-space: normal;
    overflow-wrap: break-word;
    word-break: normal;
  }
}

.gallery-lightbox-mobile-nav {
  position: absolute;
  top: 0.75rem;
  left: var(--page-gutter-safe-inline-start);
  z-index: 4;
  display: none;
  align-items: center;
  gap: 0.35rem;
}

.gallery-lightbox-mobile-nav-btn {
  box-shadow: var(--shadow-md);
}

.gallery-lightbox-nav-btn--swipe-active:not(:disabled) {
  background: rgba(20, 24, 34, 0.88);
  border-color: rgba(255, 255, 255, 0.16);
  color: white;
}

:deep(.gallery-lightbox-panel) {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  max-height: 100dvh;
  border-radius: 0;
  background: #06080c;
}

:deep(.gallery-lightbox-panel .modal-body) {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

:deep(.gallery-lightbox-panel .modal-body-content) {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

@media (min-width: 768px) {
  .gallery-count-1 {
    grid-template-columns: 1fr;
    max-width: 960px;
    margin: 0 auto;
  }

  .gallery-count-2 {
    grid-template-columns: 1fr 1fr;
  }

  .gallery-count-2 .gallery-side {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
  }

  .gallery-count-3 {
    grid-template-columns: 3fr 2fr;
  }

  .gallery-count-3 .gallery-side {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }

  .gallery-count-4 {
    grid-template-columns: 1fr 1fr;
  }

  .gallery-count-4 .gallery-side {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  }

  .gallery-count-5 {
    grid-template-columns: 1fr 1fr;
  }

  .gallery-count-5 .gallery-side {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  }
}

@media (max-width: 767px) {
  .gallery-lightbox {
    padding: 0;
  }

  .gallery-lightbox-mobile-nav {
    display: flex;
    position: fixed;
    top: 0.75rem;
    left: var(--page-gutter-safe-inline-start);
  }

  .gallery-lightbox-stage {
    touch-action: pan-y;
  }

  .gallery-lightbox-image {
    max-height: 100%;
  }

  .gallery-lightbox-nav {
    width: 42px;
    height: 42px;
  }

  .gallery-lightbox-nav-left {
    left: var(--page-gutter-safe-inline-start);
  }

  .gallery-lightbox-nav-right {
    right: var(--page-gutter-safe-inline-end);
  }

  .gallery-lightbox-footer {
    left: var(--page-gutter-safe-inline-start);
    right: var(--page-gutter-safe-inline-end);
    bottom: 1rem;
  }
}
</style>
