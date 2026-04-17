<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type ScrollMetrics = {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}

const props = defineProps({
  minThumbSize: { type: Number, default: 32 },
  fill: { type: Boolean, default: true }
})

const emit = defineEmits<{
  (event: 'scroll', payload: ScrollMetrics): void
}>()

const viewportRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)

const scrollTop = ref(0)
const scrollHeight = ref(0)
const clientHeight = ref(0)
const trackClientHeight = ref(0)
const isDragging = ref(false)
const isTrackHovered = ref(false)
const isScrolling = ref(false)

let resizeObserver: ResizeObserver | null = null
let pendingFrame = 0
let pendingScrollFrame = 0
let pendingScrollTop = 0
let pendingScrollHeight = 0
let pendingClientHeight = 0
let pendingTrackClientHeight = 0
let pendingSmoothScrollFrame = 0
let pendingDragFrame = 0
let pendingDragScrollTop = 0
let dragStartY = 0
let dragStartTop = 0
let dragPointerId: number | null = null
let dragPointerElement: HTMLElement | null = null
let scrollIdleTimer: ReturnType<typeof setTimeout> | null = null

const SMOOTH_SCROLL_MIN_DURATION_MS = 180
const SMOOTH_SCROLL_MAX_DURATION_MS = 420

function handleNestedLoad() {
  scheduleMetricsUpdate(false)
}

const isScrollable = computed(() => scrollHeight.value - clientHeight.value > 1)
const maxScrollTop = computed(() => Math.max(0, scrollHeight.value - clientHeight.value))
const trackHeight = computed(() => {
  const measuredTrackHeight = trackClientHeight.value > 0 ? trackClientHeight.value : clientHeight.value
  return Math.max(0, measuredTrackHeight)
})
const thumbInset = computed(() => (props.fill ? 0 : 6))
const thumbAvailableHeight = computed(() => {
  return Math.max(0, trackHeight.value - thumbInset.value * 2)
})
const showScrollbar = computed(() => {
  return isScrollable.value && (isDragging.value || isScrolling.value || isTrackHovered.value)
})

const thumbHeight = computed(() => {
  if (!isScrollable.value || thumbAvailableHeight.value <= 0) return 0
  const ratio = clientHeight.value / scrollHeight.value
  const rawThumbHeight = Math.max(props.minThumbSize, Math.round(trackHeight.value * ratio))
  return Math.min(thumbAvailableHeight.value, rawThumbHeight)
})

const thumbTravel = computed(() => {
  return Math.max(0, trackHeight.value - thumbHeight.value - thumbInset.value * 2)
})

const thumbTop = computed(() => {
  if (!isScrollable.value || maxScrollTop.value <= 0) return thumbInset.value
  return Math.round(thumbInset.value + (scrollTop.value / maxScrollTop.value) * thumbTravel.value)
})

const thumbStyle = computed(() => {
  return {
    height: `${thumbHeight.value}px`,
    transform: `translateY(${thumbTop.value}px)`
  }
})

function updateMetrics() {
  const element = viewportRef.value
  if (!element) return

  scrollTop.value = element.scrollTop
  updateDimensions()
}

function updateDimensions() {
  const element = viewportRef.value
  if (!element) return

  scrollHeight.value = element.scrollHeight
  clientHeight.value = element.clientHeight
  trackClientHeight.value = trackRef.value?.clientHeight || 0
}

function emitScroll() {
  emit('scroll', {
    scrollTop: scrollTop.value,
    scrollHeight: scrollHeight.value,
    clientHeight: clientHeight.value
  })
}

function scheduleMetricsUpdate(emitAfter = false) {
  if (pendingFrame) return

  pendingFrame = requestAnimationFrame(() => {
    pendingFrame = 0
    updateMetrics()
    if (emitAfter) emitScroll()
  })
}

function markScrollingActive() {
  isScrolling.value = true

  if (scrollIdleTimer) {
    clearTimeout(scrollIdleTimer)
  }

  scrollIdleTimer = setTimeout(() => {
    isScrolling.value = false
    scrollIdleTimer = null
  }, 650)
}

function handleScroll() {
  markScrollingActive()
  const element = viewportRef.value
  pendingScrollTop = element?.scrollTop || 0
  pendingScrollHeight = element?.scrollHeight || 0
  pendingClientHeight = element?.clientHeight || 0
  pendingTrackClientHeight = trackRef.value?.clientHeight || 0

  if (pendingScrollFrame) return

  pendingScrollFrame = requestAnimationFrame(() => {
    pendingScrollFrame = 0
    scrollTop.value = pendingScrollTop
    if (pendingScrollHeight > 0) {
      scrollHeight.value = pendingScrollHeight
    }
    if (pendingClientHeight > 0) {
      clientHeight.value = pendingClientHeight
    }
    if (pendingTrackClientHeight > 0) {
      trackClientHeight.value = pendingTrackClientHeight
    }
    emitScroll()
  })
}

function cancelSmoothScroll() {
  if (pendingSmoothScrollFrame) {
    cancelAnimationFrame(pendingSmoothScrollFrame)
    pendingSmoothScrollFrame = 0
  }
}

function easeInOutCubic(progress: number) {
  if (progress < 0.5) {
    return 4 * progress * progress * progress
  }

  return 1 - Math.pow(-2 * progress + 2, 3) / 2
}

function animateSmoothScrollTo(targetTop: number) {
  const element = viewportRef.value
  if (!element) return

  const startTop = element.scrollTop
  const distance = targetTop - startTop

  if (Math.abs(distance) <= 1) {
    element.scrollTop = targetTop
    pendingSmoothScrollFrame = 0
    return
  }

  const duration = Math.max(
    SMOOTH_SCROLL_MIN_DURATION_MS,
    Math.min(SMOOTH_SCROLL_MAX_DURATION_MS, Math.abs(distance) * 0.4)
  )
  const startTime = performance.now()

  const step = (now: number) => {
    const currentElement = viewportRef.value
    if (!currentElement) {
      pendingSmoothScrollFrame = 0
      return
    }

    const progress = Math.min(1, (now - startTime) / duration)
    const easedProgress = easeInOutCubic(progress)
    currentElement.scrollTop = startTop + distance * easedProgress

    if (progress < 1) {
      pendingSmoothScrollFrame = requestAnimationFrame(step)
      return
    }

    currentElement.scrollTop = targetTop
    pendingSmoothScrollFrame = 0
  }

  pendingSmoothScrollFrame = requestAnimationFrame(step)
}

function scrollTo(options: ScrollToOptions | number) {
  const element = viewportRef.value
  if (!element) return

  if (typeof options === 'number') {
    cancelSmoothScroll()
    element.scrollTo({ top: options, behavior: 'auto' })
    return
  }

  const rawTop = typeof options.top === 'number' ? options.top : element.scrollTop
  const maxTop = Math.max(0, element.scrollHeight - element.clientHeight)
  const targetTop = Math.max(0, Math.min(rawTop, maxTop))

  cancelSmoothScroll()

  if (options.behavior === 'smooth') {
    animateSmoothScrollTo(targetTop)
    return
  }

  element.scrollTo({ ...options, top: targetTop })
}

function getScrollTop() {
  return viewportRef.value?.scrollTop || 0
}

function getElement() {
  return viewportRef.value
}

function handleThumbPointerDown(event: PointerEvent) {
  if (!isScrollable.value) return
  if (event.pointerType === 'mouse' && event.button !== 0) return

  startDrag(event, viewportRef.value?.scrollTop || scrollTop.value)
}

function startDrag(event: PointerEvent, startTop: number) {
  if (event.pointerType === 'mouse' && event.button !== 0) return

  cancelSmoothScroll()
  event.preventDefault()
  dragStartY = event.clientY
  dragStartTop = startTop
  dragPointerId = event.pointerId
  dragPointerElement = event.currentTarget instanceof HTMLElement ? event.currentTarget : null

  if (dragPointerElement?.setPointerCapture) {
    try {
      dragPointerElement.setPointerCapture(event.pointerId)
    } catch {
      // Ignore capture failures on browsers with partial pointer support.
    }
  }

  isDragging.value = true

  window.addEventListener('pointermove', handleDragMove, { passive: false })
  window.addEventListener('pointerup', handleDragEnd)
  window.addEventListener('pointercancel', handleDragEnd)
}

function handleDragMove(event: PointerEvent) {
  const element = viewportRef.value
  if (!element || !isDragging.value) return
  if (dragPointerId !== null && event.pointerId !== dragPointerId) return

  if (event.cancelable) {
    event.preventDefault()
  }

  const travel = Math.max(1, thumbTravel.value)
  const scrollTravel = Math.max(1, maxScrollTop.value)
  const delta = event.clientY - dragStartY

  const nextTop = dragStartTop + (delta / travel) * scrollTravel
  pendingDragScrollTop = Math.max(0, Math.min(maxScrollTop.value, nextTop))

  if (pendingDragFrame) return

  pendingDragFrame = requestAnimationFrame(() => {
    pendingDragFrame = 0
    if (!viewportRef.value) return
    viewportRef.value.scrollTop = pendingDragScrollTop
  })
}

function handleDragEnd(event?: PointerEvent) {
  if (event && dragPointerId !== null && event.pointerId !== dragPointerId) return

  const activePointerId = dragPointerId
  dragPointerId = null
  isDragging.value = false

  if (pendingDragFrame) {
    cancelAnimationFrame(pendingDragFrame)
    pendingDragFrame = 0
  }

  if (dragPointerElement && activePointerId !== null && dragPointerElement.releasePointerCapture) {
    try {
      if (dragPointerElement.hasPointerCapture?.(activePointerId)) {
        dragPointerElement.releasePointerCapture(activePointerId)
      }
    } catch {
      // Ignore release failures if pointer already ended.
    }
  }

  dragPointerElement = null
  window.removeEventListener('pointermove', handleDragMove)
  window.removeEventListener('pointerup', handleDragEnd)
  window.removeEventListener('pointercancel', handleDragEnd)
}

function handleTrackPointerEnter() {
  isTrackHovered.value = true
}

function handleTrackPointerLeave() {
  isTrackHovered.value = false
}

function handleTrackPointerDown(event: PointerEvent) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  if (!isScrollable.value || !trackRef.value || !viewportRef.value) return

  cancelSmoothScroll()
  const bounds = trackRef.value.getBoundingClientRect()
  const clickY = event.clientY - bounds.top
  const thumbCenter = thumbHeight.value / 2
  const travel = Math.max(1, thumbTravel.value)
  const normalized = Math.max(0, Math.min(travel, clickY - thumbCenter - thumbInset.value))
  const nextTop = (normalized / travel) * maxScrollTop.value

  viewportRef.value.scrollTop = nextTop
  startDrag(event, nextTop)
}

onMounted(() => {
  updateMetrics()

  resizeObserver = new ResizeObserver(() => {
    scheduleMetricsUpdate(false)
  })

  if (viewportRef.value) {
    resizeObserver.observe(viewportRef.value)
    viewportRef.value.addEventListener('load', handleNestedLoad, true)
  }

  if (contentRef.value) {
    resizeObserver.observe(contentRef.value)
  }
})

onBeforeUnmount(() => {
  if (pendingFrame) {
    cancelAnimationFrame(pendingFrame)
  }

  if (pendingScrollFrame) {
    cancelAnimationFrame(pendingScrollFrame)
    pendingScrollFrame = 0
  }

  if (pendingDragFrame) {
    cancelAnimationFrame(pendingDragFrame)
    pendingDragFrame = 0
  }

  if (pendingSmoothScrollFrame) {
    cancelAnimationFrame(pendingSmoothScrollFrame)
    pendingSmoothScrollFrame = 0
  }

  if (viewportRef.value) {
    viewportRef.value.removeEventListener('load', handleNestedLoad, true)
  }

  resizeObserver?.disconnect()

  if (scrollIdleTimer) {
    clearTimeout(scrollIdleTimer)
    scrollIdleTimer = null
  }

  handleDragEnd()
})

defineExpose({
  scrollTo,
  getScrollTop,
  getElement,
  update: updateMetrics
})
</script>

<template>
  <div
    class="ui-scroll-container"
    :class="{
      'is-fill': props.fill,
      'is-scrollable': isScrollable,
      'is-dragging': isDragging,
      'show-scrollbar': showScrollbar
    }"
  >
    <div
      ref="viewportRef"
      class="ui-scroll-viewport"
      @wheel.passive="cancelSmoothScroll"
      @touchstart.passive="cancelSmoothScroll"
      @pointerdown="cancelSmoothScroll"
      @scroll.passive="handleScroll"
    >
      <div ref="contentRef" class="ui-scroll-content">
        <slot />
      </div>
    </div>

    <div
      v-show="isScrollable"
      class="ui-scroll-track-container"
      @pointerdown.self.prevent="handleTrackPointerDown"
    >
      <div
        ref="trackRef"
        class="ui-scroll-track"
        :class="{ 'is-hovered': isTrackHovered }"
        @pointerenter="handleTrackPointerEnter"
        @pointerleave="handleTrackPointerLeave"
        @pointerdown="handleTrackPointerDown"
      >
        <div
          class="ui-scroll-thumb"
          :style="thumbStyle"
          @pointerdown.stop.prevent="handleThumbPointerDown"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-scroll-container {
  position: relative;
  min-height: 0;
  width: 100%;
  overflow: hidden;
}

.ui-scroll-container.is-fill {
  height: 100%;
}

.ui-scroll-viewport {
  min-height: 0;
  width: 100%;
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.ui-scroll-container.is-fill .ui-scroll-viewport {
  height: 100%;
}

.ui-scroll-container:not(.is-fill) .ui-scroll-viewport {
  max-height: inherit;
}

.ui-scroll-viewport::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.ui-scroll-content {
  min-height: 100%;
}

.ui-scroll-track-container {
  position: absolute;
  top: var(--ui-scroll-track-top-offset, 0px);
  right: 0;
  bottom: var(--ui-scroll-track-bottom-offset, 0px);
  width: 2rem;
  display: flex;
  align-items: stretch;
  justify-content: center;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.18s ease;
  z-index: 12;
}

.ui-scroll-track {
  position: relative;
  width: 50%;
  height: 100%;
  overflow: visible;
  pointer-events: auto;
  touch-action: none;
  background: transparent;
  transition: background 0.18s ease;
}

.ui-scroll-thumb {
  width: 100%;
  border-radius: 999px;
  background: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(0, 0, 0, 0.3);
  cursor: grab;
  transition: background 0.18s ease, opacity 0.18s ease;
  opacity: 0;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.ui-scroll-container.show-scrollbar .ui-scroll-track-container {
  opacity: 1;
  pointer-events: auto;
}

.ui-scroll-container.is-dragging .ui-scroll-track-container {
  pointer-events: auto;
}

.ui-scroll-container.show-scrollbar .ui-scroll-thumb {
  opacity: 1;
}

.ui-scroll-track.is-hovered,
.ui-scroll-container.is-dragging .ui-scroll-track {
  background: rgba(15, 23, 42, 0.1);
}


.ui-scroll-container.is-dragging .ui-scroll-thumb {
  cursor: grabbing;
}

@media (max-width: 640px) {
  .ui-scroll-track-container {
    pointer-events: auto;
    width: calc(var(--space-4) * 2);
    justify-content: flex-end;
    touch-action: none;
  }

  .ui-scroll-track {
    width: var(--space-4);
  }
}
</style>
