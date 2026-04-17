<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type PropType } from 'vue'
import { useRoute } from 'vue-router'
import type { ListingSummary } from '~/types/domain'

const props = defineProps({
  listings: { type: Array as PropType<ListingSummary[]>, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String as PropType<string | null>, default: null }
})

type ListingGridRow = {
  id: string
  items: ListingSummary[]
  placeholderCount: number
}

const gridElement = ref<HTMLElement | null>(null)
const scrollContainer = ref<HTMLElement | null>(null)
const gridWidth = ref(0)
const viewportHeight = ref(0)
const scrollTop = ref(0)
const useLightweightRows = ref(false)
const protectedRowStart = ref(-1)
const protectedRowEnd = ref(-1)
let resizeObserver: ResizeObserver | null = null
let scrollAnimationFrame = 0
let pendingScrollTop = 0
let fastScrollTimer: ReturnType<typeof setTimeout> | null = null
let lastScrollFrameTime = 0

const GRID_GAP = 20
const MIN_CARD_WIDTH = 300
const CARD_BODY_HEIGHT = 88
const NORMAL_OVERSCAN_ROWS = 4
const FAST_OVERSCAN_ROWS = 2
const FAST_SCROLL_ENTER_VELOCITY = 1.35
const FAST_SCROLL_EXIT_VELOCITY = 10
const FAST_SCROLL_RELEASE_DELAY_MS = 70
const PROTECTED_VISIBLE_ROW_BUFFER = 1
const COLUMN_DENSITY_OFFSET = 1
const DEFAULT_IMAGE_ASPECT_RATIO = 2 / 3
const TWO_COLUMN_MIN_IMAGE_ASPECT_RATIO = 0.5
const TWO_COLUMN_MAX_CARD_WIDTH = 460
const MOBILE_SCROLL_TARGET_RATIO = 0.3

const hasListings = computed(() => props.listings.length > 0)
const route = useRoute()

const activeOverlayListingSlug = computed(() => {
  const rawHash = route.hash.startsWith('#') ? route.hash.slice(1) : route.hash
  if (!rawHash) return null

  const hashParams = new URLSearchParams(rawHash)
  const listingSlug = hashParams.get('listing')
  return listingSlug ? decodeURIComponent(listingSlug) : null
})

const columnCount = computed(() => {
  if (gridWidth.value <= 0) return 1

  const rawColumns = Math.floor((gridWidth.value + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP))
  const baseColumns = Math.max(1, rawColumns)
  const densityOffset = baseColumns >= 3 ? COLUMN_DENSITY_OFFSET : 0
  return Math.max(1, baseColumns - densityOffset)
})

const cardWidth = computed(() => {
  if (gridWidth.value <= 0) return MIN_CARD_WIDTH

  const totalGapWidth = GRID_GAP * (columnCount.value - 1)
  return Math.max(0, (gridWidth.value - totalGapWidth) / columnCount.value)
})

const imageAspectRatio = computed(() => {
  if (cardWidth.value <= 0) return DEFAULT_IMAGE_ASPECT_RATIO

  if (columnCount.value === 2) {
    const ratioRange = DEFAULT_IMAGE_ASPECT_RATIO - TWO_COLUMN_MIN_IMAGE_ASPECT_RATIO
    const widthProgress = Math.max(0, Math.min(1, (cardWidth.value - MIN_CARD_WIDTH) / (TWO_COLUMN_MAX_CARD_WIDTH - MIN_CARD_WIDTH)))
    return DEFAULT_IMAGE_ASPECT_RATIO - ratioRange * widthProgress
  }

  return DEFAULT_IMAGE_ASPECT_RATIO
})

const rowHeight = computed(() => {
  const imageHeight = Math.ceil(cardWidth.value * imageAspectRatio.value)
  return imageHeight + CARD_BODY_HEIGHT + GRID_GAP
})

const listingRows = computed(() => {
  const rows: ListingGridRow[] = []

  for (let index = 0; index < props.listings.length; index += columnCount.value) {
    const items = props.listings.slice(index, index + columnCount.value)
    const rowKey = items.length > 0
      ? `row-${items.map((listing) => listing.id).join('|')}`
      : `row-empty-${index}`

    rows.push({
      id: rowKey,
      items,
      placeholderCount: Math.max(0, columnCount.value - items.length)
    })
  }

  return rows
})

const totalHeight = computed(() => {
  if (listingRows.value.length === 0) {
    return 0
  }

  return listingRows.value.length * rowHeight.value - GRID_GAP
})

const overscanRows = computed(() => (useLightweightRows.value ? FAST_OVERSCAN_ROWS : NORMAL_OVERSCAN_ROWS))

const startRow = computed(() => {
  if (rowHeight.value === 0) return 0
  return Math.max(0, Math.floor(scrollTop.value / rowHeight.value) - overscanRows.value)
})

const endRow = computed(() => {
  if (rowHeight.value === 0) return listingRows.value.length

  return Math.min(
    listingRows.value.length,
    Math.ceil((scrollTop.value + viewportHeight.value) / rowHeight.value) + overscanRows.value
  )
})

const visibleRows = computed(() => {
  return listingRows.value.slice(startRow.value, endRow.value)
})

function getRowOffset(visibleIndex: number) {
  return (startRow.value + visibleIndex) * rowHeight.value
}

function captureProtectedRows() {
  protectedRowStart.value = Math.max(0, startRow.value - PROTECTED_VISIBLE_ROW_BUFFER)
  protectedRowEnd.value = Math.min(listingRows.value.length, endRow.value + PROTECTED_VISIBLE_ROW_BUFFER)
}

function clearProtectedRows() {
  protectedRowStart.value = -1
  protectedRowEnd.value = -1
}

function shouldUseSkeletonForRow(globalRowIndex: number) {
  if (!useLightweightRows.value) return false

  if (protectedRowStart.value >= 0 && protectedRowEnd.value > protectedRowStart.value) {
    return globalRowIndex < protectedRowStart.value || globalRowIndex >= protectedRowEnd.value
  }

  return true
}

function updateMeasurements() {
  gridWidth.value = gridElement.value?.clientWidth || 0
  viewportHeight.value = scrollContainer.value?.clientHeight || 0
  scrollTop.value = scrollContainer.value?.scrollTop || 0
}

function handleScroll() {
  pendingScrollTop = scrollContainer.value?.scrollTop || 0

  if (scrollAnimationFrame) return

  scrollAnimationFrame = requestAnimationFrame(() => {
    scrollAnimationFrame = 0
    if (Math.abs(scrollTop.value - pendingScrollTop) < 0.5) return

    const now = performance.now()
    const elapsed = lastScrollFrameTime > 0 ? Math.max(1, now - lastScrollFrameTime) : 16
    lastScrollFrameTime = now

    const delta = Math.abs(scrollTop.value - pendingScrollTop)
    const velocity = delta / elapsed
    const enterDelta = Math.max(180, rowHeight.value * 0.55)
    const exitDelta = Math.max(56, rowHeight.value * 0.2)
    const shouldEnterLightweight = delta > enterDelta || velocity > FAST_SCROLL_ENTER_VELOCITY
    const shouldExitLightweight = delta < exitDelta && velocity < FAST_SCROLL_EXIT_VELOCITY

    if (shouldEnterLightweight) {
      if (!useLightweightRows.value) {
        // Keep already-visible rows mounted when fast scrolling starts.
        captureProtectedRows()
      }
      useLightweightRows.value = true
    } else if (useLightweightRows.value && shouldExitLightweight) {
      // Restore cards as soon as scrolling slows down, without waiting for a full stop.
      useLightweightRows.value = false
      clearProtectedRows()
    }

    if (fastScrollTimer) {
      clearTimeout(fastScrollTimer)
    }

    if (useLightweightRows.value) {
      fastScrollTimer = setTimeout(() => {
        useLightweightRows.value = false
        clearProtectedRows()
        fastScrollTimer = null
      }, FAST_SCROLL_RELEASE_DELAY_MS)
    }

    scrollTop.value = pendingScrollTop
  })
}

function resolveScrollContainer() {
  const root = gridElement.value?.closest('.catalog-results') as HTMLElement | null
  if (!root) return null

  const customViewport = root.querySelector('.ui-scroll-viewport') as HTMLElement | null
  return customViewport || root
}

function scrollToListing(slug: string) {
  if (!slug) return false

  if (!scrollContainer.value) {
    scrollContainer.value = resolveScrollContainer()
  }

  const container = scrollContainer.value
  if (!container) return false

  const listingIndex = props.listings.findIndex((listing) => listing.slug === slug)
  if (listingIndex < 0) return false

  const targetRow = Math.floor(listingIndex / Math.max(1, columnCount.value))
  const targetRowTop = targetRow * rowHeight.value
  const targetRowContentHeight = Math.max(0, rowHeight.value - GRID_GAP)
  const currentViewportHeight = viewportHeight.value || container.clientHeight || 0
  const isMobileViewport = typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches
  const targetViewportRatio = isMobileViewport ? MOBILE_SCROLL_TARGET_RATIO : 0.5
  const centeredTop = targetRowTop + targetRowContentHeight / 2 - currentViewportHeight * targetViewportRatio
  const maxScrollTop = Math.max(0, totalHeight.value - currentViewportHeight)
  const nextTop = Math.max(0, Math.min(centeredTop, maxScrollTop))

  container.scrollTo({ top: nextTop, behavior: 'auto' })
  scrollTop.value = nextTop
  return true
}

onMounted(() => {
  scrollContainer.value = resolveScrollContainer()
  lastScrollFrameTime = 0
  clearProtectedRows()
  updateMeasurements()

  if (gridElement.value) {
    resizeObserver = new ResizeObserver(() => {
      updateMeasurements()
    })
    resizeObserver.observe(gridElement.value)
  }

  if (scrollContainer.value) {
    resizeObserver?.observe(scrollContainer.value)
    scrollContainer.value.addEventListener('scroll', handleScroll, { passive: true })
  }
})

onBeforeUnmount(() => {
  scrollContainer.value?.removeEventListener('scroll', handleScroll)
  if (scrollAnimationFrame) {
    cancelAnimationFrame(scrollAnimationFrame)
    scrollAnimationFrame = 0
  }
  if (fastScrollTimer) {
    clearTimeout(fastScrollTimer)
    fastScrollTimer = null
  }
  clearProtectedRows()
  lastScrollFrameTime = 0
  resizeObserver?.disconnect()
})

defineExpose({
  scrollToListing
})
</script>

<template>
  <div
    ref="gridElement"
    class="listing-grid-wrapper"
    :class="{
      'listing-grid-wrapper--has-results': !loading && !error && hasListings
    }"
  >
    <UiStatusState
      v-if="loading"
      state="loading"
      loading-label="Chargement des jardins..."
      fill
    />

    <UiStatusState
      v-else-if="error"
      state="error"
      title="Impossible de charger les jardins"
      message="Le serveur ne répond pas"
      fill
    />

    <UiStatusState
      v-else-if="!hasListings"
      state="empty"
      title="Aucun jardin trouvé"
      message="Essayez de modifier vos filtres de recherche."
      fill
    />

    <div v-else class="listing-virtual-space" :style="{ height: `${totalHeight}px` }">
      <div
        v-for="(row, visibleIndex) in visibleRows"
        :key="row.id"
        class="listing-row listing-row-virtual"
        :style="{ transform: `translateY(${getRowOffset(visibleIndex)}px)`, gap: `${GRID_GAP}px` }"
      >
        <div
          v-for="(listing, itemIndex) in row.items"
          :key="listing.id"
          class="listing-cell"
          :class="{ 'listing-cell--active-overlay': activeOverlayListingSlug === listing.slug }"
          :style="{ width: `${cardWidth}px`, height: `${rowHeight - GRID_GAP}px` }"
        >
          <div v-if="shouldUseSkeletonForRow(startRow + visibleIndex)" class="listing-card-skeleton" aria-hidden="true"></div>
          <ListingCard
            v-else
            :id="listing.id"
            :title="listing.title"
            :slug="listing.slug"
            :price-cents="listing.price_cents"
            :currency="listing.currency"
            :thumbnail="listing.thumbnail"
            :area-m2="listing.area_m2"
            :capacity="listing.capacity"
            :address="listing.address"
            :tags="listing.tags?.equipment || []"
            :image-aspect-ratio="imageAspectRatio"
            :image-loading="startRow + visibleIndex === 0 ? 'eager' : 'lazy'"
            :image-fetch-priority="startRow + visibleIndex === 0 && itemIndex === 0 ? 'high' : 'auto'"
          />
        </div>

        <div
          v-for="placeholderIndex in row.placeholderCount"
          :key="`${row.id}-placeholder-${placeholderIndex}`"
          class="listing-cell listing-cell-placeholder"
          :style="{ width: `${cardWidth}px` }"
          aria-hidden="true"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.listing-grid-wrapper {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  width: 100%;
}

.listing-grid-wrapper--has-results {
  display: block;
  flex: 0 0 auto;
  min-height: 0;
}

.listing-grid-wrapper :deep(.loading-spinner),
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  width: 100%;
}

.listing-grid-wrapper :deep(.ui-status-state--fill) {
  min-height: 0;
  height: 100%;
}

.listing-virtual-space {
  position: relative;
  width: 100%;
}

.listing-row {
  display: flex;
  align-items: flex-start;
  box-sizing: border-box;
  width: 100%;
}

.listing-row-virtual {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  will-change: transform;
}

.listing-cell {
  flex: 0 0 auto;
  overflow: hidden;
  opacity: 1;
  transition: opacity var(--catalog-overlay-active-transition-duration) var(--catalog-overlay-active-transition-easing) !important;
}

.listing-cell--active-overlay {
  opacity: var(--catalog-overlay-card-active-opacity);
}

.listing-card-skeleton {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, #f4f5f7 0%, #eceef2 100%);
  border: 1px solid var(--color-border);
}

.listing-cell-placeholder {
  pointer-events: none;
  visibility: hidden;
}
</style>
