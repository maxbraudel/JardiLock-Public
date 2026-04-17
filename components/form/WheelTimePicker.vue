<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'HH:MM' },
  label: { type: String, default: '' },
  minuteStep: { type: Number, default: 5 }
})

const emit = defineEmits(['update:modelValue'])

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const hours = Array.from({ length: 24 }, (_, i) => i)
const minutes = computed(() => {
  const m: number[] = []
  for (let i = 0; i < 60; i += props.minuteStep) m.push(i)
  return m
})

// Currently selected values inside the picker (committed on confirm)
const pickerHour = ref(0)
const pickerMinute = ref(0)

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  return props.modelValue
})

// ---------------------------------------------------------------------------
// Open / Close
// ---------------------------------------------------------------------------
function openPicker() {
  // Parse current value
  if (props.modelValue) {
    const [h, m] = props.modelValue.split(':').map(Number)
    pickerHour.value = h
    pickerMinute.value = snapMinute(m)
  } else {
    pickerHour.value = 12
    pickerMinute.value = 0
  }
  open.value = true
  nextTick(() => {
    scrollToSelected(hourListRef.value, pickerHour.value, hours.length, true)
    scrollToSelected(minuteListRef.value, pickerMinute.value / props.minuteStep, minutes.value.length, true)
  })
}

function closePicker() {
  open.value = false
}

function confirm() {
  const hh = String(pickerHour.value).padStart(2, '0')
  const mm = String(pickerMinute.value).padStart(2, '0')
  emit('update:modelValue', `${hh}:${mm}`)
  closePicker()
}

function clear() {
  emit('update:modelValue', '')
  closePicker()
}

function snapMinute(m: number) {
  return Math.round(m / props.minuteStep) * props.minuteStep % 60
}

// ---------------------------------------------------------------------------
// Click outside
// ---------------------------------------------------------------------------
function onClickOutside(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node
  if (panelRef.value?.contains(target)) return
  if (triggerRef.value?.contains(target)) return
  closePicker()
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))

// ---------------------------------------------------------------------------
// Infinite wheel logic
// ---------------------------------------------------------------------------
const ITEM_HEIGHT = 40
const VISIBLE_ITEMS = 5 // must be odd
const HALF = Math.floor(VISIBLE_ITEMS / 2)

const hourListRef = ref<HTMLElement | null>(null)
const minuteListRef = ref<HTMLElement | null>(null)

// We render enough repeated copies so the user can scroll "infinitely"
const CLONES = 40 // total copies of the data set

function getRepeatedArray<T>(arr: T[]): T[] {
  const result: T[] = []
  for (let i = 0; i < CLONES; i++) result.push(...arr)
  return result
}

const repeatedHours = computed(() => getRepeatedArray(hours))
const repeatedMinutes = computed(() => getRepeatedArray(minutes.value))

function getTargetScroll(displayIndex: number) {
  return displayIndex * ITEM_HEIGHT - HALF * ITEM_HEIGHT
}

function getNearestIndex(scrollTop: number, totalItems: number) {
  const centerOffset = scrollTop + HALF * ITEM_HEIGHT
  const rawIndex = Math.round(centerOffset / ITEM_HEIGHT)
  const itemIndex = ((rawIndex % totalItems) + totalItems) % totalItems

  return {
    rawIndex,
    itemIndex,
    targetScroll: getTargetScroll(rawIndex)
  }
}

function scrollToSelected(el: HTMLElement | null, index: number, totalItems: number, instant = false) {
  if (!el) return
  // Scroll to the middle clone set so we have room to scroll both ways
  const middleStart = Math.floor(CLONES / 2) * totalItems
  const targetIndex = middleStart + index
  const scrollPos = getTargetScroll(targetIndex)
  el.scrollTo({ top: scrollPos, behavior: instant ? 'auto' : 'smooth' })
}

// ---------------------------------------------------------------------------
// Scroll handling with snapping
// ---------------------------------------------------------------------------
let hourSnapTimer: ReturnType<typeof setTimeout> | null = null
let minuteSnapTimer: ReturnType<typeof setTimeout> | null = null
let hourDragSnapRestoreTimer: ReturnType<typeof setTimeout> | null = null
let minuteDragSnapRestoreTimer: ReturnType<typeof setTimeout> | null = null
let hourReleaseAnimationFrame: number | null = null
let minuteReleaseAnimationFrame: number | null = null
let isHourReleaseAnimating = false
let isMinuteReleaseAnimating = false

function finalizeScrollPosition(el: HTMLElement | null, totalItems: number, setter: (idx: number) => void) {
  if (!el) return

  const { rawIndex, itemIndex } = getNearestIndex(el.scrollTop, totalItems)
  setter(itemIndex)

  // Re-center far from the middle clone to keep the infinite wheel illusion.
  if (rawIndex < totalItems * 2 || rawIndex > totalItems * (CLONES - 2)) {
    const recenteredIndex = Math.floor(CLONES / 2) * totalItems + itemIndex
    el.scrollTop = getTargetScroll(recenteredIndex)
  }
}

function onHourScroll() {
  if (dragTarget === 'hour' || isHourReleaseAnimating) {
    if (hourListRef.value) {
      const { itemIndex } = getNearestIndex(hourListRef.value.scrollTop, hours.length)
      pickerHour.value = hours[itemIndex]
    }
    return
  }

  if (hourSnapTimer) clearTimeout(hourSnapTimer)
  if (hourListRef.value) {
    const { itemIndex } = getNearestIndex(hourListRef.value.scrollTop, hours.length)
    pickerHour.value = hours[itemIndex]
  }

  hourSnapTimer = setTimeout(() => finalizeScrollPosition(hourListRef.value, hours.length, (idx) => {
    pickerHour.value = hours[idx]
  }), 96)
}

function onMinuteScroll() {
  if (dragTarget === 'minute' || isMinuteReleaseAnimating) {
    if (minuteListRef.value) {
      const { itemIndex } = getNearestIndex(minuteListRef.value.scrollTop, minutes.value.length)
      pickerMinute.value = minutes.value[itemIndex]
    }
    return
  }

  if (minuteSnapTimer) clearTimeout(minuteSnapTimer)
  if (minuteListRef.value) {
    const { itemIndex } = getNearestIndex(minuteListRef.value.scrollTop, minutes.value.length)
    pickerMinute.value = minutes.value[itemIndex]
  }

  minuteSnapTimer = setTimeout(() => finalizeScrollPosition(minuteListRef.value, minutes.value.length, (idx) => {
    pickerMinute.value = minutes.value[idx]
  }), 96)
}

function cancelHourAutoScroll() {
  if (hourSnapTimer) {
    clearTimeout(hourSnapTimer)
    hourSnapTimer = null
  }
}

function cancelMinuteAutoScroll() {
  if (minuteSnapTimer) {
    clearTimeout(minuteSnapTimer)
    minuteSnapTimer = null
  }
}

function cancelHourDragSnapRestore() {
  if (hourDragSnapRestoreTimer) {
    clearTimeout(hourDragSnapRestoreTimer)
    hourDragSnapRestoreTimer = null
  }
}

function cancelMinuteDragSnapRestore() {
  if (minuteDragSnapRestoreTimer) {
    clearTimeout(minuteDragSnapRestoreTimer)
    minuteDragSnapRestoreTimer = null
  }
}

function scheduleHourDragSnapRestore(el: HTMLElement) {
  cancelHourDragSnapRestore()
  hourDragSnapRestoreTimer = setTimeout(() => {
    el.style.scrollSnapType = ''
    hourDragSnapRestoreTimer = null
  }, 220)
}

function scheduleMinuteDragSnapRestore(el: HTMLElement) {
  cancelMinuteDragSnapRestore()
  minuteDragSnapRestoreTimer = setTimeout(() => {
    el.style.scrollSnapType = ''
    minuteDragSnapRestoreTimer = null
  }, 220)
}

function cancelHourReleaseAnimation() {
  if (hourReleaseAnimationFrame !== null && typeof window !== 'undefined') {
    window.cancelAnimationFrame(hourReleaseAnimationFrame)
    hourReleaseAnimationFrame = null
  }
  isHourReleaseAnimating = false
}

function cancelMinuteReleaseAnimation() {
  if (minuteReleaseAnimationFrame !== null && typeof window !== 'undefined') {
    window.cancelAnimationFrame(minuteReleaseAnimationFrame)
    minuteReleaseAnimationFrame = null
  }
  isMinuteReleaseAnimating = false
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function animateHourRelease(el: HTMLElement, targetScroll: number) {
  cancelHourReleaseAnimation()
  cancelHourAutoScroll()
  isHourReleaseAnimating = true
  el.style.scrollSnapType = 'none'

  const startScroll = el.scrollTop
  const delta = targetScroll - startScroll
  const duration = 180
  const startTime = performance.now()

  const step = (now: number) => {
    const progress = Math.min(1, (now - startTime) / duration)
    const nextScroll = startScroll + delta * easeOutCubic(progress)
    el.scrollTop = nextScroll
    hourScrollTop.value = nextScroll

    const { itemIndex } = getNearestIndex(nextScroll, hours.length)
    pickerHour.value = hours[itemIndex]

    if (progress < 1) {
      hourReleaseAnimationFrame = window.requestAnimationFrame(step)
      return
    }

    el.scrollTop = targetScroll
    hourScrollTop.value = targetScroll
    const { itemIndex: finalIndex } = getNearestIndex(targetScroll, hours.length)
    pickerHour.value = hours[finalIndex]
    isHourReleaseAnimating = false
    hourReleaseAnimationFrame = null
    scheduleHourDragSnapRestore(el)
  }

  hourReleaseAnimationFrame = window.requestAnimationFrame(step)
}

function animateMinuteRelease(el: HTMLElement, targetScroll: number) {
  cancelMinuteReleaseAnimation()
  cancelMinuteAutoScroll()
  isMinuteReleaseAnimating = true
  el.style.scrollSnapType = 'none'

  const startScroll = el.scrollTop
  const delta = targetScroll - startScroll
  const duration = 180
  const startTime = performance.now()

  const step = (now: number) => {
    const progress = Math.min(1, (now - startTime) / duration)
    const nextScroll = startScroll + delta * easeOutCubic(progress)
    el.scrollTop = nextScroll
    minuteScrollTop.value = nextScroll

    const { itemIndex } = getNearestIndex(nextScroll, minutes.value.length)
    pickerMinute.value = minutes.value[itemIndex]

    if (progress < 1) {
      minuteReleaseAnimationFrame = window.requestAnimationFrame(step)
      return
    }

    el.scrollTop = targetScroll
    minuteScrollTop.value = targetScroll
    const { itemIndex: finalIndex } = getNearestIndex(targetScroll, minutes.value.length)
    pickerMinute.value = minutes.value[finalIndex]
    isMinuteReleaseAnimating = false
    minuteReleaseAnimationFrame = null
    scheduleMinuteDragSnapRestore(el)
  }

  minuteReleaseAnimationFrame = window.requestAnimationFrame(step)
}

// ---------------------------------------------------------------------------
// Discrete mouse-wheel: snap one item instantly, no smooth scroll.
// Trackpad / touch continue to use native smooth scroll.
// ---------------------------------------------------------------------------

// Directly manipulate the DOM element's style (not Vue refs) so the
// scroll-snap change takes effect synchronously before the scrollTop
// assignment — Vue reactive updates are batched/async and would be
// too late, leaving the browser free to animate the snap enforcement.
function snapScrollInstant(el: HTMLElement, targetScroll: number) {
  // 1. Disable snap synchronously via inline style (overrides CSS class rule)
  el.style.scrollSnapType = 'none'
  // 2. Force the browser to flush pending style recalculations so the
  //    snap-type change is committed before we touch scrollTop.
  //    Reading offsetHeight triggers a synchronous layout flush.
  void el.offsetHeight
  // 3. Jump to position — no snap enforcement because snap is off
  el.scrollTop = targetScroll
  // 4. Re-enable snap in the next animation frame.  The scroll position is
  //    already aligned with a snap point (getTargetScroll returns exact
  //    multiples of ITEM_HEIGHT centered on snap-align: center), so the
  //    browser finds the nearest snap = current position and does not move.
  requestAnimationFrame(() => {
    el.style.scrollSnapType = ''
  })
}

// A WheelEvent is from a physical mouse wheel if:
//   - deltaMode is LINE or PAGE (physical wheel notches = non-pixel units), or
//   - deltaMode is PIXEL but the value is a large integer (Windows mouse wheel
//     in pixel mode typically sends 100 px per notch; trackpads send small,
//     often fractional values).
// If neither condition matches we let the event through so trackpad / inertia
// scrolling keeps working natively.
function isDiscreteMouseWheel(e: WheelEvent): boolean {
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE || e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return true
  }
  // Horizontal component stronger than vertical = trackpad diagonal swipe
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5) return false
  // Fractional pixel delta = trackpad (smooth inertia / momentum)
  if (!Number.isInteger(e.deltaY)) return false
  // Large integer = physical wheel notch in pixel mode (≥ 40 px).
  // Trackpad on Windows can send small integers (1-20 px), so this
  // threshold separates the two reliably.
  return Math.abs(e.deltaY) >= 40
}

function onWheelHour(e: WheelEvent) {
  if (!isDiscreteMouseWheel(e)) return  // trackpad / touch → native scroll

  cancelHourReleaseAnimation()
  e.preventDefault()
  e.stopPropagation()
  cancelHourAutoScroll()

  const el = hourListRef.value
  if (!el || !e.deltaY) return

  const { rawIndex } = getNearestIndex(el.scrollTop, hours.length)
  const direction = e.deltaY > 0 ? 1 : -1
  const targetRaw = rawIndex + direction
  const targetScroll = getTargetScroll(targetRaw)
  const itemIndex = ((targetRaw % hours.length) + hours.length) % hours.length

  snapScrollInstant(el, targetScroll)
  pickerHour.value = hours[itemIndex]
  hourScrollTop.value = targetScroll
}

function onWheelMinute(e: WheelEvent) {
  if (!isDiscreteMouseWheel(e)) return  // trackpad / touch → native scroll

  cancelMinuteReleaseAnimation()
  e.preventDefault()
  e.stopPropagation()
  cancelMinuteAutoScroll()

  const el = minuteListRef.value
  if (!el || !e.deltaY) return

  const { rawIndex } = getNearestIndex(el.scrollTop, minutes.value.length)
  const direction = e.deltaY > 0 ? 1 : -1
  const targetRaw = rawIndex + direction
  const targetScroll = getTargetScroll(targetRaw)
  const itemIndex = ((targetRaw % minutes.value.length) + minutes.value.length) % minutes.value.length

  snapScrollInstant(el, targetScroll)
  pickerMinute.value = minutes.value[itemIndex]
  minuteScrollTop.value = targetScroll
}

function attachWheelListeners() {
  detachWheelListeners()
  hourListRef.value?.addEventListener('wheel', onWheelHour, { passive: false })
  minuteListRef.value?.addEventListener('wheel', onWheelMinute, { passive: false })
}

function detachWheelListeners() {
  hourListRef.value?.removeEventListener('wheel', onWheelHour)
  minuteListRef.value?.removeEventListener('wheel', onWheelMinute)
}

// ---------------------------------------------------------------------------
// Mouse drag to scroll (left-click + drag up / down)
// Moving the mouse UP = content moves up = next item (+1)
// Moving the mouse DOWN = content moves down = previous item (-1)
// ---------------------------------------------------------------------------
type DragTarget = 'hour' | 'minute' | null
let dragTarget: DragTarget = null
let dragLastY = 0
let dragDistance = 0
let dragHasMoved = false
const isDragging = ref(false)

function onDragMouseDown(e: MouseEvent, target: DragTarget) {
  if (e.button !== 0) return  // left button only
  dragTarget = target
  dragLastY = e.clientY
  dragDistance = 0
  dragHasMoved = false
  isDragging.value = true
  if (target === 'hour') {
    cancelHourReleaseAnimation()
    cancelHourAutoScroll()
    cancelHourDragSnapRestore()
    if (hourListRef.value) hourListRef.value.style.scrollSnapType = 'none'
  } else if (target === 'minute') {
    cancelMinuteReleaseAnimation()
    cancelMinuteAutoScroll()
    cancelMinuteDragSnapRestore()
    if (minuteListRef.value) minuteListRef.value.style.scrollSnapType = 'none'
  }
  e.preventDefault()  // prevent text selection while dragging
  document.addEventListener('mousemove', onDragMouseMove)
  document.addEventListener('mouseup', onDragMouseUp, { once: true })
}

function onDragMouseMove(e: MouseEvent) {
  if (!dragTarget) return
  e.preventDefault()
  // dy > 0 when mouse moves up → scrollTop increases → later values
  const dy = dragLastY - e.clientY
  dragLastY = e.clientY
  dragDistance += Math.abs(dy)
  if (dragDistance > 4) dragHasMoved = true

  if (!dy) return

  if (dragTarget === 'hour') {
    const el = hourListRef.value
    if (!el) return
    el.scrollTop += dy
    hourScrollTop.value = el.scrollTop
    const { itemIndex } = getNearestIndex(el.scrollTop, hours.length)
    pickerHour.value = hours[itemIndex]
  } else {
    const el = minuteListRef.value
    if (!el) return
    el.scrollTop += dy
    minuteScrollTop.value = el.scrollTop
    const { itemIndex } = getNearestIndex(el.scrollTop, minutes.value.length)
    pickerMinute.value = minutes.value[itemIndex]
  }
}

function onDragMouseUp() {
  const activeDragTarget = dragTarget
  isDragging.value = false
  dragTarget = null
  document.removeEventListener('mousemove', onDragMouseMove)

  if (activeDragTarget === 'hour' && hourListRef.value) {
    const el = hourListRef.value
    const { targetScroll, itemIndex } = getNearestIndex(el.scrollTop, hours.length)
    animateHourRelease(el, targetScroll)
    pickerHour.value = hours[itemIndex]
  }

  if (activeDragTarget === 'minute' && minuteListRef.value) {
    const el = minuteListRef.value
    const { targetScroll, itemIndex } = getNearestIndex(el.scrollTop, minutes.value.length)
    animateMinuteRelease(el, targetScroll)
    pickerMinute.value = minutes.value[itemIndex]
  }

  // Defer reset so the click event (which fires after mouseup) can still read dragHasMoved
  setTimeout(() => { dragHasMoved = false }, 0)
}

// ---------------------------------------------------------------------------
// Touch / pointer wheel selection by tapping an item
// ---------------------------------------------------------------------------
function selectHour(displayIndex: number) {
  if (dragHasMoved) return  // ignore click after a drag gesture
  const itemIndex = displayIndex % hours.length
  pickerHour.value = hours[itemIndex]
  if (hourListRef.value) {
    hourListRef.value.scrollTo({
      top: getTargetScroll(displayIndex),
      behavior: 'smooth'
    })
  }
}

function selectMinute(displayIndex: number) {
  if (dragHasMoved) return  // ignore click after a drag gesture
  const itemIndex = displayIndex % minutes.value.length
  pickerMinute.value = minutes.value[itemIndex]
  if (minuteListRef.value) {
    minuteListRef.value.scrollTo({
      top: getTargetScroll(displayIndex),
      behavior: 'smooth'
    })
  }
}

// ---------------------------------------------------------------------------
// Visual: which item is "selected" (center of viewport)
// ---------------------------------------------------------------------------
const hourScrollTop = ref(0)
const minuteScrollTop = ref(0)

function trackHourScroll() {
  if (hourListRef.value) hourScrollTop.value = hourListRef.value.scrollTop
  onHourScroll()
}
function trackMinuteScroll() {
  if (minuteListRef.value) minuteScrollTop.value = minuteListRef.value.scrollTop
  onMinuteScroll()
}

function clearSnapTimers() {
  if (hourSnapTimer) {
    clearTimeout(hourSnapTimer)
    hourSnapTimer = null
  }

  if (minuteSnapTimer) {
    clearTimeout(minuteSnapTimer)
    minuteSnapTimer = null
  }

  cancelHourDragSnapRestore()
  cancelMinuteDragSnapRestore()
  cancelHourReleaseAnimation()
  cancelMinuteReleaseAnimation()
}

watch(open, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      attachWheelListeners()
    })
  } else {
    detachWheelListeners()
    clearSnapTimers()
    // Clean up any in-progress mouse drag when the picker closes
    if (dragTarget) {
      isDragging.value = false
      hourListRef.value?.style.removeProperty('scroll-snap-type')
      minuteListRef.value?.style.removeProperty('scroll-snap-type')
      dragTarget = null
      document.removeEventListener('mousemove', onDragMouseMove)
    }
  }
})

onBeforeUnmount(() => {
  detachWheelListeners()
  clearSnapTimers()
  hourListRef.value?.style.removeProperty('scroll-snap-type')
  minuteListRef.value?.style.removeProperty('scroll-snap-type')
  document.removeEventListener('mousemove', onDragMouseMove)
})

function itemOpacity(scrollTop: number, displayIndex: number) {
  const centerOffset = scrollTop + HALF * ITEM_HEIGHT
  const itemCenter = displayIndex * ITEM_HEIGHT + ITEM_HEIGHT / 2
  const dist = Math.abs(centerOffset - itemCenter) / ITEM_HEIGHT
  if (dist < 0.5) return 1
  if (dist > 2.5) return 0.2
  return Math.max(0.2, 1 - (dist - 0.5) * 0.35)
}

function itemScale(scrollTop: number, displayIndex: number) {
  const centerOffset = scrollTop + HALF * ITEM_HEIGHT
  const itemCenter = displayIndex * ITEM_HEIGHT + ITEM_HEIGHT / 2
  const dist = Math.abs(centerOffset - itemCenter) / ITEM_HEIGHT
  if (dist < 0.5) return 1
  return Math.max(0.85, 1 - dist * 0.05)
}
</script>

<template>
  <div class="wheel-time-picker" ref="triggerRef">
    <label v-if="label" class="wheel-time-picker__label">{{ label }}</label>
    <UiInputFrame :active="open" class="wheel-time-picker__trigger-shell">
      <template #leading>
        <svg class="wheel-time-picker__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
          <path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </template>

      <button
        type="button"
        class="wheel-time-picker__trigger-control"
        :class="{ 'has-value': !!modelValue }"
        aria-haspopup="dialog"
        @click="openPicker"
      >
        <span class="wheel-time-picker__text">{{ displayValue || placeholder }}</span>
      </button>

      <template v-if="modelValue" #trailing>
        <UiFieldClearButton
          class="wheel-time-picker__clear"
          :label="label ? `Effacer ${label.toLowerCase()}` : 'Effacer l\'heure'"
          @click="clear"
        />
      </template>
    </UiInputFrame>

    <Teleport to="body">
      <Transition name="picker-fade">
        <div v-if="open" class="wheel-time-picker__overlay">
          <div class="wheel-time-picker__backdrop" @mousedown="closePicker" />
          <div ref="panelRef" class="wheel-time-picker__panel">
            <div class="wheel-time-picker__header">
              <span class="wheel-time-picker__title">
                {{ String(pickerHour).padStart(2, '0') }}:{{ String(pickerMinute).padStart(2, '0') }}
              </span>
            </div>

            <div class="wheel-time-picker__wheels">
              <!-- Hour wheel -->
              <div class="wheel-col">
                <span class="wheel-col__label">Heure</span>
                <div class="wheel-viewport">
                  <div class="wheel-highlight" />
                  <div
                    ref="hourListRef"
                    class="wheel-scroll"
                    :class="{ 'wheel-scroll--dragging': isDragging }"
                    :style="{ height: VISIBLE_ITEMS * ITEM_HEIGHT + 'px' }"
                    @mousedown="onDragMouseDown($event, 'hour')"
                    @touchstart.passive="cancelHourAutoScroll"
                    @scroll="trackHourScroll"
                  >
                    <div
                      v-for="(h, i) in repeatedHours"
                      :key="'h' + i"
                      class="wheel-item"
                      :style="{
                        height: ITEM_HEIGHT + 'px',
                        lineHeight: ITEM_HEIGHT + 'px',
                        opacity: itemOpacity(hourScrollTop, i),
                        transform: 'scale(' + itemScale(hourScrollTop, i) + ')'
                      }"
                      @click="selectHour(i)"
                    >
                      {{ String(h).padStart(2, '0') }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="wheel-separator">:</div>

              <!-- Minute wheel -->
              <div class="wheel-col">
                <span class="wheel-col__label">Min</span>
                <div class="wheel-viewport">
                  <div class="wheel-highlight" />
                  <div
                    ref="minuteListRef"
                    class="wheel-scroll"
                    :class="{ 'wheel-scroll--dragging': isDragging }"
                    :style="{ height: VISIBLE_ITEMS * ITEM_HEIGHT + 'px' }"
                    @mousedown="onDragMouseDown($event, 'minute')"
                    @touchstart.passive="cancelMinuteAutoScroll"
                    @scroll="trackMinuteScroll"
                  >
                    <div
                      v-for="(m, i) in repeatedMinutes"
                      :key="'m' + i"
                      class="wheel-item"
                      :style="{
                        height: ITEM_HEIGHT + 'px',
                        lineHeight: ITEM_HEIGHT + 'px',
                        opacity: itemOpacity(minuteScrollTop, i),
                        transform: 'scale(' + itemScale(minuteScrollTop, i) + ')'
                      }"
                      @click="selectMinute(i)"
                    >
                      {{ String(m).padStart(2, '0') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="wheel-time-picker__actions">
              <UiPillButton class="wheel-action" @click="clear">
                Effacer
              </UiPillButton>
              <UiPillButton variant="primary" class="wheel-action" @click="confirm">
                OK
              </UiPillButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* --- Trigger button --- */
.wheel-time-picker {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  gap: 0.25rem;
  min-width: 0;
}

.wheel-time-picker__label {
  font-size: 0.75rem;
  color: var(--color-text-light);
}

.wheel-time-picker__trigger-shell {
  width: 100%;
}

.wheel-time-picker__trigger-shell:hover {
  border-color: var(--color-primary);
}

.wheel-time-picker__trigger-control {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  cursor: pointer;
}

.wheel-time-picker__trigger-control.has-value {
  color: var(--color-text);
}

.wheel-time-picker__icon {
  display: block;
}

.wheel-time-picker__clear {
  flex-shrink: 0;
}

.wheel-time-picker__text {
  flex: 1;
  min-width: 0;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* --- Overlay --- */
.wheel-time-picker__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-time-picker-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
}

.wheel-time-picker__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
}

/* --- Panel --- */
.wheel-time-picker__panel {
  position: relative;
  z-index: 1;
  background: var(--color-bg);
  border: var(--floating-panel-border);
  border-radius: var(--floating-panel-radius);
  box-shadow: var(--floating-panel-shadow);
  width: min(300px, 90vw);
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

.wheel-time-picker__header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1.25rem 0.5rem;
}

.wheel-time-picker__title {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

/* --- Wheels container --- */
.wheel-time-picker__wheels {
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 0 1.25rem 0.5rem;
  gap: 0;
}

.wheel-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.wheel-col__label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: 0.375rem;
}

.wheel-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-muted);
  padding-top: 1.2rem;
  width: 1.5rem;
  flex-shrink: 0;
}

/* --- Wheel viewport & scroll --- */
.wheel-viewport {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  width: 100%;
}

.wheel-highlight {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 12px);
  height: 40px;
  border-radius: 10px;
  background: var(--color-primary);
  opacity: 0.1;
  pointer-events: none;
  z-index: 1;
}

.wheel-scroll {
  overflow-y: auto;
  scroll-behavior: auto;
  scrollbar-width: none;
  scroll-snap-type: y mandatory;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
  cursor: ns-resize;
}

.wheel-scroll--dragging,
.wheel-scroll--dragging * {
  cursor: ns-resize !important;
  user-select: none;
}

.wheel-scroll::-webkit-scrollbar {
  display: none;
}

/* --- Wheel items --- */
.wheel-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
  cursor: pointer;
  transition: color 0.1s;
  will-change: opacity, transform;
  scroll-snap-align: center;
}

/* --- Actions --- */
.wheel-time-picker__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--floating-toolbar-gap);
  padding: 0.625rem 1.25rem 1rem;
  border-top: 1px solid var(--color-border);
}

.wheel-time-picker__actions :deep(.pill-btn) {
  justify-content: center;
}

/* --- Transition --- */
.picker-fade-enter-active {
  transition: opacity 0.18s ease !important;
}
.picker-fade-enter-active .wheel-time-picker__panel {
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease !important;
}

.picker-fade-leave-active {
  transition: opacity 0.12s ease !important;
}
.picker-fade-leave-active .wheel-time-picker__panel {
  transition: transform 0.12s ease, opacity 0.12s ease !important;
}

.picker-fade-enter-from {
  opacity: 0;
}
.picker-fade-enter-from .wheel-time-picker__panel {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}

.picker-fade-leave-to {
  opacity: 0;
}
.picker-fade-leave-to .wheel-time-picker__panel {
  opacity: 0;
  transform: scale(0.97) translateY(4px);
}
</style>
