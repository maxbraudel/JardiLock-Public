import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

const SWIPE_CLOSE_MIN_DISTANCE = 90
const SWIPE_CLOSE_MAX_HORIZONTAL_DRIFT = 56

interface UseModalCloseInteractionsOptions {
  panelRef: Ref<HTMLElement | null>
  getScrollTop: () => number
  onClose: () => void
}

export function useModalCloseInteractions(options: UseModalCloseInteractionsOptions) {
  const touchStartX = ref<number | null>(null)
  const touchStartY = ref<number | null>(null)
  const swipeCandidate = ref(false)
  const gestureScrollableAncestor = ref<HTMLElement | null>(null)
  const closeSwipeActive = ref(false)

  let previousOverflow = ''

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      options.onClose()
    }
  }

  function isTouchCloseEnabled() {
    if (typeof window === 'undefined') {
      return false
    }

    return window.matchMedia('(hover: none) and (pointer: coarse)').matches
  }

  function getScrollableAncestor(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
      return null
    }

    let node: HTMLElement | null = target
    while (node && node !== options.panelRef.value) {
      const style = window.getComputedStyle(node)
      const canScrollY = /auto|scroll|overlay/.test(style.overflowY)
      if (canScrollY && node.scrollHeight > node.clientHeight) {
        return node
      }
      node = node.parentElement
    }

    return null
  }

  function getCurrentScrollTop() {
    return gestureScrollableAncestor.value?.scrollTop ?? options.getScrollTop()
  }

  function resetSwipeGesture() {
    touchStartX.value = null
    touchStartY.value = null
    swipeCandidate.value = false
    gestureScrollableAncestor.value = null
    closeSwipeActive.value = false
  }

  function handleTouchStart(event: TouchEvent) {
    if (!isTouchCloseEnabled() || event.touches.length !== 1) {
      resetSwipeGesture()
      return
    }

    gestureScrollableAncestor.value = getScrollableAncestor(event.target)
    if (getCurrentScrollTop() > 0) {
      resetSwipeGesture()
      return
    }

    const touch = event.touches[0]
    touchStartX.value = touch.clientX
    touchStartY.value = touch.clientY
    swipeCandidate.value = true
  }

  function handleTouchMove(event: TouchEvent) {
    if (!swipeCandidate.value || event.touches.length !== 1) {
      return
    }

    if (getCurrentScrollTop() > 0) {
      resetSwipeGesture()
      return
    }

    const touch = event.touches[0]
    const startX = touchStartX.value
    const startY = touchStartY.value
    if (startX === null || startY === null) {
      return
    }

    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY
    const isDownwardSwipe = deltaY > 0
    const withinHorizontalDrift = Math.abs(deltaX) <= SWIPE_CLOSE_MAX_HORIZONTAL_DRIFT

    closeSwipeActive.value = isDownwardSwipe && withinHorizontalDrift && deltaY >= 14

    if (isDownwardSwipe && withinHorizontalDrift && event.cancelable) {
      event.preventDefault()
    }
  }

  function handleTouchEnd(event: TouchEvent) {
    if (!swipeCandidate.value || event.changedTouches.length === 0) {
      resetSwipeGesture()
      return
    }

    const startX = touchStartX.value
    const startY = touchStartY.value
    if (startX === null || startY === null) {
      resetSwipeGesture()
      return
    }

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY
    const shouldClose =
      deltaY >= SWIPE_CLOSE_MIN_DISTANCE &&
      Math.abs(deltaX) <= SWIPE_CLOSE_MAX_HORIZONTAL_DRIFT &&
      getCurrentScrollTop() <= 0

    resetSwipeGesture()

    if (shouldClose) {
      options.onClose()
    }
  }

  onMounted(() => {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeydown)
  })

  onBeforeUnmount(() => {
    document.body.style.overflow = previousOverflow
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    closeSwipeActive,
    handleTouchEnd,
    handleTouchMove,
    handleTouchStart,
    resetSwipeGesture
  }
}