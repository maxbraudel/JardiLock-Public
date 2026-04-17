import { nextTick, onBeforeUnmount, onMounted, type Ref } from 'vue'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ')

type UseFocusTrapOptions = {
  containerRef: Ref<HTMLElement | null>
}

function isFocusableElementVisible(element: HTMLElement) {
  if (element.hidden || element.getAttribute('aria-hidden') === 'true') {
    return false
  }

  const style = window.getComputedStyle(element)

  return style.display !== 'none' && style.visibility !== 'hidden'
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => isFocusableElementVisible(element))
}

function focusElement(element: HTMLElement | null) {
  element?.focus({ preventScroll: true })
}

export function useFocusTrap(options: UseFocusTrapOptions) {
  let previousActiveElement: HTMLElement | null = null

  function focusFirstInteractiveElement() {
    const container = options.containerRef.value

    if (!container) {
      return
    }

    const [firstFocusable] = getFocusableElements(container)
    focusElement(firstFocusable || container)
  }

  function handleDocumentKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') {
      return
    }

    const container = options.containerRef.value

    if (!container) {
      return
    }

    const focusableElements = getFocusableElements(container)

    if (focusableElements.length === 0) {
      event.preventDefault()
      focusElement(container)
      return
    }

    const activeElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

    if (!activeElement || !container.contains(activeElement)) {
      event.preventDefault()
      focusElement(focusableElements[0] || null)
      return
    }

    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    if (event.shiftKey && activeElement === firstFocusable) {
      event.preventDefault()
      focusElement(lastFocusable || null)
      return
    }

    if (!event.shiftKey && activeElement === lastFocusable) {
      event.preventDefault()
      focusElement(firstFocusable || null)
    }
  }

  onMounted(() => {
    previousActiveElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

    void nextTick(() => {
      focusFirstInteractiveElement()
    })

    document.addEventListener('keydown', handleDocumentKeydown)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleDocumentKeydown)

    if (previousActiveElement && document.contains(previousActiveElement)) {
      focusElement(previousActiveElement)
    }
  })

  return {
    focusFirstInteractiveElement
  }
}