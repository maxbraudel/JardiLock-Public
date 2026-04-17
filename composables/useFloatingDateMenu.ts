import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

const PANEL_MENU_OFFSET_PX = 12
const PANEL_MENU_EDGE_OVERLAP_PX = 2
const DATE_MENU_MAX_WIDTH_PX = 420
const DATE_MENU_VIEWPORT_PADDING_PX = 16
const DATE_MENU_READY_ATTR = 'data-catalog-position-ready'

interface DateMenuElements {
  menuRoot: HTMLElement
  menuWrapper: HTMLElement
}

interface UseFloatingDateMenuOptions {
  datePanelRef: Ref<HTMLElement | null>
  selectedDate: Ref<string>
  emitSelectedDate: (value: string) => void
  dateMenuId: string
}

export function useFloatingDateMenu(options: UseFloatingDateMenuOptions) {
  const localDate = ref<string | null>(options.selectedDate.value || null)

  let pendingDateMenuFrame = 0
  let pendingDateMenuRevealFrame = 0
  let dateMenuMountObserver: MutationObserver | null = null
  let dateMenuStyleObserver: MutationObserver | null = null
  let isDateMenuPositionReady = false

  watch(options.selectedDate, (value) => {
    localDate.value = value || null
  })

  function getDateMenuRoot() {
    if (typeof document === 'undefined') {
      return null
    }

    return document.getElementById(options.dateMenuId) as HTMLElement | null
  }

  function getDateMenuWrapper() {
    const menuRoot = getDateMenuRoot()
    return menuRoot?.parentElement as HTMLElement | null
  }

  function getDateMenuElements(): DateMenuElements | null {
    const menuRoot = getDateMenuRoot()
    if (!menuRoot) return null

    const menuWrapper = getDateMenuWrapper() || menuRoot
    return { menuRoot, menuWrapper }
  }

  function setDateMenuReady(menuRoot: HTMLElement, ready: boolean) {
    menuRoot.setAttribute(DATE_MENU_READY_ATTR, ready ? 'true' : 'false')
  }

  function stopDateMenuObservers() {
    dateMenuMountObserver?.disconnect()
    dateMenuMountObserver = null
    dateMenuStyleObserver?.disconnect()
    dateMenuStyleObserver = null
  }

  function cancelDateMenuPositioning() {
    if (!pendingDateMenuFrame) return

    cancelAnimationFrame(pendingDateMenuFrame)
    pendingDateMenuFrame = 0
  }

  function cancelDateMenuReveal() {
    if (!pendingDateMenuRevealFrame) return

    cancelAnimationFrame(pendingDateMenuRevealFrame)
    pendingDateMenuRevealFrame = 0
  }

  function scheduleDateMenuReveal() {
    if (typeof window === 'undefined') {
      return
    }

    cancelDateMenuReveal()
    pendingDateMenuRevealFrame = requestAnimationFrame(() => {
      pendingDateMenuRevealFrame = requestAnimationFrame(() => {
        pendingDateMenuRevealFrame = 0
        isDateMenuPositionReady = true
        positionDateMenu(true)
      })
    })
  }

  function scheduleDateMenuPosition(reveal = isDateMenuPositionReady) {
    if (typeof window === 'undefined') {
      return
    }

    cancelDateMenuPositioning()
    pendingDateMenuFrame = requestAnimationFrame(() => {
      pendingDateMenuFrame = 0
      positionDateMenu(reveal)
    })
  }

  function positionDateMenu(reveal = isDateMenuPositionReady): boolean {
    if (typeof window === 'undefined' || !options.datePanelRef.value) return false

    const dateMenuElements = getDateMenuElements()
    if (!dateMenuElements) return false

    const { menuRoot, menuWrapper } = dateMenuElements
    const rect = options.datePanelRef.value.getBoundingClientRect()
    const unclampedWidth = rect.width + PANEL_MENU_EDGE_OVERLAP_PX * 2
    const viewportMaxWidth = Math.max(220, window.innerWidth - DATE_MENU_VIEWPORT_PADDING_PX * 2)
    const width = Math.max(220, Math.min(unclampedWidth, DATE_MENU_MAX_WIDTH_PX, viewportMaxWidth))
    const maxLeftPx = window.innerWidth - DATE_MENU_VIEWPORT_PADDING_PX - width
    let leftPx = rect.left + rect.width / 2 - width / 2
    leftPx = Math.max(DATE_MENU_VIEWPORT_PADDING_PX, Math.min(leftPx, maxLeftPx))

    const left = `${Math.round(leftPx)}px`
    const top = `${rect.bottom + PANEL_MENU_OFFSET_PX}px`
    const computedWidth = `${Math.round(width)}px`

    if (menuWrapper.style.position !== 'fixed') menuWrapper.style.position = 'fixed'
    if (menuWrapper.style.left !== left) menuWrapper.style.left = left
    if (menuWrapper.style.top !== top) menuWrapper.style.top = top
    if (menuWrapper.style.right !== 'auto') menuWrapper.style.right = 'auto'
    if (menuWrapper.style.bottom !== 'auto') menuWrapper.style.bottom = 'auto'
    if (menuWrapper.style.width !== computedWidth) menuWrapper.style.width = computedWidth
    if (menuWrapper.style.minWidth !== computedWidth) menuWrapper.style.minWidth = computedWidth
    if (menuWrapper.style.maxWidth !== computedWidth) menuWrapper.style.maxWidth = computedWidth
    if (menuWrapper.style.transform !== 'none') menuWrapper.style.transform = 'none'
    if (menuWrapper.style.transition !== 'none') menuWrapper.style.transition = 'none'
    menuWrapper.style.setProperty('translate', 'none')

    if (menuRoot.style.width !== computedWidth) menuRoot.style.width = computedWidth
    if (menuRoot.style.minWidth !== computedWidth) menuRoot.style.minWidth = computedWidth
    if (menuRoot.style.maxWidth !== computedWidth) menuRoot.style.maxWidth = computedWidth
    if (menuRoot.style.left !== '0px') menuRoot.style.left = '0px'
    if (menuRoot.style.top !== '0px') menuRoot.style.top = '0px'
    if (menuRoot.style.right !== 'auto') menuRoot.style.right = 'auto'
    if (menuRoot.style.bottom !== 'auto') menuRoot.style.bottom = 'auto'
    if (menuRoot.style.transform !== 'none') menuRoot.style.transform = 'none'
    if (menuRoot.style.transition !== 'none') menuRoot.style.transition = 'none'
    menuRoot.style.setProperty('translate', 'none')
    menuRoot.style.setProperty('--dp-menu-width', computedWidth)

    setDateMenuReady(menuRoot, reveal)

    if (reveal) {
      menuWrapper.style.removeProperty('visibility')
      menuWrapper.style.removeProperty('opacity')
      menuWrapper.style.removeProperty('pointer-events')
      menuRoot.style.removeProperty('visibility')
      menuRoot.style.removeProperty('opacity')
      menuRoot.style.removeProperty('pointer-events')
    }

    return true
  }

  function attachDateMenuStyleObserver(elements: DateMenuElements) {
    if (typeof MutationObserver === 'undefined') {
      return
    }

    dateMenuStyleObserver?.disconnect()
    dateMenuStyleObserver = new MutationObserver(() => {
      scheduleDateMenuPosition()
    })

    dateMenuStyleObserver.observe(elements.menuWrapper, {
      attributes: true,
      attributeFilter: ['style']
    })

    if (elements.menuRoot !== elements.menuWrapper) {
      dateMenuStyleObserver.observe(elements.menuRoot, {
        attributes: true,
        attributeFilter: ['style']
      })
    }
  }

  function startDateMenuPositioning() {
    stopDateMenuObservers()
    isDateMenuPositionReady = false
    cancelDateMenuPositioning()
    cancelDateMenuReveal()

    const dateMenuElements = getDateMenuElements()
    if (dateMenuElements) {
      setDateMenuReady(dateMenuElements.menuRoot, false)
      attachDateMenuStyleObserver(dateMenuElements)
      positionDateMenu(false)
      scheduleDateMenuPosition(false)
      scheduleDateMenuReveal()
      return
    }

    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') {
      return
    }

    dateMenuMountObserver = new MutationObserver(() => {
      const mountedElements = getDateMenuElements()
      if (!mountedElements) return

      setDateMenuReady(mountedElements.menuRoot, false)
      attachDateMenuStyleObserver(mountedElements)
      positionDateMenu(false)
      scheduleDateMenuPosition(false)
      scheduleDateMenuReveal()
      dateMenuMountObserver?.disconnect()
      dateMenuMountObserver = null
    })

    dateMenuMountObserver.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  function handleDateChange(value: string | null) {
    localDate.value = value
    options.emitSelectedDate(value || '')
  }

  function clearDate() {
    localDate.value = null
    options.emitSelectedDate('')
  }

  function handleDateMenuOpen() {
    void nextTick(() => {
      startDateMenuPositioning()
    })
  }

  function handleDateMenuClosed() {
    isDateMenuPositionReady = false
    const dateMenuElements = getDateMenuElements()
    if (dateMenuElements) {
      setDateMenuReady(dateMenuElements.menuRoot, false)
    }

    cancelDateMenuPositioning()
    cancelDateMenuReveal()
    stopDateMenuObservers()
  }

  function handleViewportChange() {
    scheduleDateMenuPosition()
  }

  onMounted(() => {
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleViewportChange)
    window.removeEventListener('scroll', handleViewportChange, true)
    handleDateMenuClosed()
  })

  return {
    clearDate,
    handleDateChange,
    handleDateMenuClosed,
    handleDateMenuOpen,
    localDate
  }
}