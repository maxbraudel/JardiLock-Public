<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  /** Pixels scrolled per button click */
  scrollStep?: number
  /** Apply scroll-snap-type: x proximity on the container */
  snap?: boolean
  /** CSS selector used to find item candidates for arrow navigation. */
  itemSelector?: string
  /** Alignment used when scrolling to previous/next item. */
  itemAlign?: 'start' | 'center'
}>(), {
  scrollStep: 240,
  snap: false,
  itemSelector: '',
  itemAlign: 'start'
})

const container = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

let buttonAnimationId: number | null = null

function updateState() {
  const el = container.value
  if (!el) {
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }
  canScrollLeft.value = el.scrollLeft > 1
  canScrollRight.value = Math.ceil(el.scrollLeft) < el.scrollWidth - el.clientWidth - 1
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getItemCandidates(el: HTMLElement) {
  if (props.itemSelector) {
    return Array.from(el.querySelectorAll<HTMLElement>(props.itemSelector))
  }

  return Array.from(el.children).filter(
    (node): node is HTMLElement => node instanceof HTMLElement
  )
}

function getReferenceForMode(el: HTMLElement) {
  return props.itemAlign === 'center'
    ? el.scrollLeft + el.clientWidth / 2
    : el.scrollLeft
}

function getCandidateReference(candidate: HTMLElement) {
  return props.itemAlign === 'center'
    ? candidate.offsetLeft + candidate.offsetWidth / 2
    : candidate.offsetLeft
}

function getCandidateTargetLeft(el: HTMLElement, candidate: HTMLElement) {
  return props.itemAlign === 'center'
    ? candidate.offsetLeft + candidate.offsetWidth / 2 - el.clientWidth / 2
    : candidate.offsetLeft
}

function animateScrollTo(targetLeft: number) {
  const el = container.value
  if (!el) return

  const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth)
  const clampedTarget = clamp(targetLeft, 0, maxScrollLeft)

  if (buttonAnimationId !== null) {
    cancelAnimationFrame(buttonAnimationId)
    buttonAnimationId = null
  }

  el.scrollLeft = clampedTarget
  updateState()
  restoreSnap()
}

function restoreSnap() {
  if (snapRestoreTimer) clearTimeout(snapRestoreTimer)
  snapRestoreTimer = setTimeout(() => {
    snapRestoreTimer = null
    if (!container.value) return
    container.value.style.scrollSnapType = ''
  }, 160)
}

function suspendSnap() {
  const el = container.value
  if (!el) return
  if (el.style.scrollSnapType !== 'none') {
    el.style.scrollSnapType = 'none'
  }
  restoreSnap()
}

function animateScrollBy(delta: number) {
  const el = container.value
  if (!el) return

  const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth)
  const startLeft = el.scrollLeft
  const targetLeft = clamp(startLeft + delta, 0, maxScrollLeft)

  if (Math.abs(targetLeft - startLeft) < 1) return

  suspendSnap()
  animateScrollTo(targetLeft)
}

function scrollToAdjacentItem(direction: -1 | 1) {
  const el = container.value
  if (!el) return

  const candidates = getItemCandidates(el)
  if (!candidates.length) {
    animateScrollBy(direction * props.scrollStep)
    return
  }

  const currentReference = getReferenceForMode(el)
  let nearestIndex = 0
  let nearestDistance = Number.POSITIVE_INFINITY

  for (let index = 0; index < candidates.length; index += 1) {
    const distance = Math.abs(getCandidateReference(candidates[index]) - currentReference)
    if (distance >= nearestDistance) continue
    nearestDistance = distance
    nearestIndex = index
  }

  const targetIndex = clamp(nearestIndex + direction, 0, candidates.length - 1)
  if (targetIndex === nearestIndex) {
    updateState()
    return
  }

  suspendSnap()
  const targetLeft = getCandidateTargetLeft(el, candidates[targetIndex])
  animateScrollTo(targetLeft)
}

function scrollLeft() {
  scrollToAdjacentItem(-1)
}

function scrollRight() {
  scrollToAdjacentItem(1)
}

/**
 * Convert the WheelEvent delta to pixels regardless of deltaMode.
 */
function getPixelDelta(event: WheelEvent): number {
  if (event.deltaMode === 0) return event.deltaY            // already pixels
  if (event.deltaMode === 1) return event.deltaY * 40       // lines → ~40px each
  return event.deltaY * (container.value?.clientWidth ?? 600) // pages
}

// rAF-batching state: accumulate wheel deltas between frames
let pendingDelta = 0
let rafId: number | null = null

// Snap-suppression state: disable scroll-snap during gesture to prevent per-event stutter
let snapRestoreTimer: ReturnType<typeof setTimeout> | null = null

function flushScroll() {
  rafId = null
  const el = container.value
  if (!el || pendingDelta === 0) { pendingDelta = 0; return }
  el.scrollBy({ left: pendingDelta })
  pendingDelta = 0
}

function onWheel(event: WheelEvent) {
  const el = container.value
  if (!el) return

  // Not scrollable at all → don't interfere
  if (el.scrollWidth <= el.clientWidth + 1) return

  // Clear horizontal gesture (deltaX dominant) → let the browser handle natively
  if (Math.abs(event.deltaX) > 1) return

  const delta = getPixelDelta(event)

  // At the right edge going further right → release to page scroll
  if (delta > 0 && Math.ceil(el.scrollLeft) >= el.scrollWidth - el.clientWidth - 1) return
  // At the left edge going further left → release to page scroll
  if (delta < 0 && el.scrollLeft <= 1) return

  event.preventDefault()

  // Suppress scroll-snap during the gesture so snap points don't fire on every micro-delta.
  // The inline style overrides the CSS class value; clearing it restores the original rule.
  suspendSnap()

  // Batch deltas: accumulate and flush once per animation frame instead of on every event
  pendingDelta += delta
  if (rafId === null) {
    rafId = requestAnimationFrame(flushScroll)
  }
}

function handleScroll() {
  updateState()
}

let resizeObserver: ResizeObserver | null = null
let mutationObserver: MutationObserver | null = null

onMounted(() => {
  const el = container.value
  if (!el) return

  el.addEventListener('wheel', onWheel, { passive: false })
  el.addEventListener('scroll', handleScroll, { passive: true })

  // Re-check when the container itself is resized (e.g. sidebar width change)
  resizeObserver = new ResizeObserver(() => nextTick(updateState))
  resizeObserver.observe(el)

  // Re-check when inner content changes (e.g. items loaded asynchronously)
  mutationObserver = new MutationObserver(() => nextTick(updateState))
  mutationObserver.observe(el, { childList: true, subtree: true })

  nextTick(updateState)
})

onUnmounted(() => {
  const el = container.value
  if (el) {
    el.removeEventListener('wheel', onWheel)
    el.removeEventListener('scroll', handleScroll)
  }
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
  if (buttonAnimationId !== null) cancelAnimationFrame(buttonAnimationId)
  if (rafId !== null) cancelAnimationFrame(rafId)
  if (snapRestoreTimer !== null) clearTimeout(snapRestoreTimer)
})
</script>

<template>
  <div
    class="hscroll-root"
    :class="{
      'hscroll-root--fade-left': canScrollLeft,
      'hscroll-root--fade-right': canScrollRight
    }"
  >
    <Transition name="hscroll-btn">
      <UiIconButton
        v-if="canScrollLeft"
        variant="default"
        size="sm"
        class="hscroll-btn hscroll-btn--left"
        label="Défiler à gauche"
        tabindex="-1"
        @click="scrollLeft"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </UiIconButton>
    </Transition>

    <div
      ref="container"
      class="hscroll-container"
      :class="{ 'hscroll-container--snap': snap }"
    >
      <slot />
    </div>

    <Transition name="hscroll-btn">
      <UiIconButton
        v-if="canScrollRight"
        variant="default"
        size="sm"
        class="hscroll-btn hscroll-btn--right"
        label="Défiler à droite"
        tabindex="-1"
        @click="scrollRight"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </UiIconButton>
    </Transition>
  </div>
</template>

<style scoped>
.hscroll-root {
  position: relative;
}

/* The actual scrollable viewport */
.hscroll-container {
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
}
.hscroll-container::-webkit-scrollbar {
  display: none; /* Chrome / Safari */
}
.hscroll-container--snap {
  scroll-snap-type: x proximity;
}

/* Soft fade at edges to hint that content continues */
.hscroll-root--fade-left .hscroll-container {
  -webkit-mask-image: linear-gradient(to right, transparent 0, black 40px, black 100%);
  mask-image: linear-gradient(to right, transparent 0, black 40px, black 100%);
}
.hscroll-root--fade-right .hscroll-container {
  -webkit-mask-image: linear-gradient(to right, black 0, black calc(100% - 40px), transparent 100%);
  mask-image: linear-gradient(to right, black 0, black calc(100% - 40px), transparent 100%);
}
.hscroll-root--fade-left.hscroll-root--fade-right .hscroll-container {
  -webkit-mask-image: linear-gradient(to right, transparent 0, black 40px, black calc(100% - 40px), transparent 100%);
  mask-image: linear-gradient(to right, transparent 0, black 40px, black calc(100% - 40px), transparent 100%);
}

/* Arrow buttons — positioning overrides for UiIconButton */
.hscroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  user-select: none;
}

.hscroll-btn--left  { left:  6px; }
.hscroll-btn--right { right: 6px; }

/* Fade in / out when buttons appear or disappear */
.hscroll-btn-enter-active,
.hscroll-btn-leave-active {
  transition: opacity 0.15s ease;
}
.hscroll-btn-enter-from,
.hscroll-btn-leave-to {
  opacity: 0;
}

/* Hide navigation buttons on touch-only devices — users swipe natively */
@media (hover: none) {
  .hscroll-btn {
    display: none;
  }
}
</style>
