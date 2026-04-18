<script setup lang="ts">
import { computed } from 'vue'
import { useCatalogPageState } from '~/composables/useCatalogPageState'
import { useListings } from '~/composables/useListings'
import type {
  CatalogFilterOptions,
  CatalogFiltersState,
  ListingSortField,
  ListingSortOrder
} from '~/types/domain'

const {
  filteredListings,
  sortedListings,
  loading,
  error,
  resultCount,
  locationQuery,
  selectedLocation,
  sortField,
  sortOrder,
  minArea,
  maxPrice,
  selectedEquipment,
  selectedEvents,
  animalsOnly,
  selectedDate,
  selectedDays,
  timeFrom,
  timeTo,
  publicHolidaysOnly,
  availableEquipment,
  availableEvents
} = useListings()

const arrowUpwardIcon = new URL('../../assets/images/icons/arrow_upward.svg', import.meta.url).href
const removeFiltersIcon = new URL('../../assets/images/icons/remove_filters.svg', import.meta.url).href
const zoomInIcon = new URL('../../assets/images/icons/zoom_in.svg', import.meta.url).href
const zoomOutIcon = new URL('../../assets/images/icons/zoom_out.svg', import.meta.url).href

const catalogFilters = computed<CatalogFiltersState>({
  get() {
    return {
      minArea: minArea.value,
      maxPrice: maxPrice.value,
      selectedEquipment: selectedEquipment.value,
      selectedEvents: selectedEvents.value,
      animalsOnly: animalsOnly.value,
      selectedDays: selectedDays.value,
      timeFrom: timeFrom.value,
      timeTo: timeTo.value,
      publicHolidaysOnly: publicHolidaysOnly.value
    }
  },
  set(nextFilters) {
    minArea.value = nextFilters.minArea
    maxPrice.value = nextFilters.maxPrice
    selectedEquipment.value = nextFilters.selectedEquipment
    selectedEvents.value = nextFilters.selectedEvents
    animalsOnly.value = nextFilters.animalsOnly
    selectedDays.value = nextFilters.selectedDays
    timeFrom.value = nextFilters.timeFrom
    timeTo.value = nextFilters.timeTo
    publicHolidaysOnly.value = nextFilters.publicHolidaysOnly
  }
})

const catalogFilterOptions = computed<CatalogFilterOptions>(() => ({
  availableEquipment: availableEquipment.value,
  availableEvents: availableEvents.value
}))

const {
  activeFilterCount,
  bottomBarRef,
  catalogMainStyle,
  catalogResultsBottomInset,
  catalogResultsTopInset,
  catalogSidebarTopInset,
  catalogViewToggleLabel,
  clearAllFilters,
  closeDesktopFilters,
  closeMobileFilters,
  desktopFiltersVisible,
  handleBottomFiltersAction,
  handleResultsScroll,
  handleSortChange,
  isDesktopFiltersCollapsed,
  isFiltersOpen,
  isMapView,
  isMobileViewport,
  listingGridRef,
  listingMapRef,
  mapShellRef,
  mapViewportInsets,
  resultsContainer,
  scrollResultsToTop,
  shouldMountMap,
  showDesktopFilters,
  showScrollToTop,
  sidebarFloatingActionsRef,
  sidebarResultLabel,
  toggleCatalogViewMode,
  toolbarRef,
  zoomMapIn,
  zoomMapOut
} = useCatalogPageState({
  sortedListings,
  resultCount,
  catalogFilters,
  locationQuery,
  selectedLocation,
  sortField,
  sortOrder
})
</script>

<template>
  <div class="catalog-page" :class="{ 'catalog-page--filters-collapsed': isDesktopFiltersCollapsed }">
    <aside v-show="showDesktopFilters" class="catalog-sidebar-shell">
      <div ref="sidebarFloatingActionsRef" class="catalog-sidebar-floating-actions">
        <div
          class="catalog-sidebar-primary-actions"
          :class="{ 'catalog-sidebar-primary-actions--single': activeFilterCount === 0 }"
        >
          <UiFloatingTextLabel class="catalog-sidebar-results-label" truncate>
            {{ sidebarResultLabel }}
          </UiFloatingTextLabel>

          <UiButtonCore
            v-if="activeFilterCount > 0"
            class="catalog-filters-clear catalog-filters-clear--desktop"
            variant="primary"
            size="sm"
            floating
            type="button"
            @click="clearAllFilters"
          >
            <template #leading>
              <img :src="removeFiltersIcon" alt="" class="catalog-filters-clear-icon" aria-hidden="true" />
            </template>
            Retirer les filtres
          </UiButtonCore>
        </div>

        <UiIconButton
          class="catalog-sidebar-close"
          variant="surface-light"
          label="Fermer les filtres"
          size="md"
          @click="closeDesktopFilters"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18.3 5.71L12 12l6.3 6.29-1.41 1.41L10.59 13.41 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29l6.3 6.3 6.29-6.3z" fill="currentColor"/>
          </svg>
        </UiIconButton>
      </div>

      <UiScrollContainer
        class="catalog-sidebar"
        :top-inset-scrollbar="catalogSidebarTopInset"
        bottom-inset-scrollbar="var(--floating-offset)"
        :top-inset-content="catalogSidebarTopInset"
        bottom-inset-content="var(--floating-offset)"
      >
        <div class="catalog-sidebar-content">
        <ListingFilters
          aria-label="Filtres catalogue"
          v-model="catalogFilters"
          :options="catalogFilterOptions"
        />
        </div>
      </UiScrollContainer>
    </aside>

    <section class="catalog-main" :style="catalogMainStyle">
      <div ref="toolbarRef" class="catalog-toolbar">
        <FormCatalogSearchBar
          class="catalog-search"
          :location-query="locationQuery"
          @update:location-query="locationQuery = $event"
          :selected-location="selectedLocation"
          @update:selected-location="selectedLocation = $event"
          :selected-date="selectedDate"
          @update:selected-date="selectedDate = $event"
        />

        <ListingSortBar
          :current-sort="sortField"
          :current-order="sortOrder"
          @sort-change="handleSortChange"
        />
      </div>

      <UiScrollContainer
        v-show="!isMapView"
        ref="resultsContainer"
        class="catalog-results"
        :top-inset-scrollbar="catalogResultsTopInset"
        :bottom-inset-scrollbar="catalogResultsBottomInset"
        :top-inset-content="catalogResultsTopInset"
        :bottom-inset-content="catalogResultsBottomInset"
        @scroll="handleResultsScroll"
      >
        <div class="catalog-results-content">
          <ListingGrid
            ref="listingGridRef"
            :listings="sortedListings"
            :loading="loading"
            :error="error"
          />
        </div>
      </UiScrollContainer>

      <div v-if="shouldMountMap" ref="mapShellRef" v-show="isMapView" class="catalog-map-shell">
        <ListingCatalogMap
          ref="listingMapRef"
          :listings="filteredListings"
          :active="isMapView"
          :viewport-insets="mapViewportInsets"
        />
      </div>

      <div ref="bottomBarRef" class="catalog-bottom-bar">
        <div class="catalog-bottom-slot catalog-bottom-slot--left">
          <UiPillButton
            v-if="!isMapView"
            variant="secondary"
            class="catalog-bottom-action"
            :class="{ 'catalog-bottom-action--hidden': !showScrollToTop }"
            @click="scrollResultsToTop"
          >
            <template #leading>
              <img :src="arrowUpwardIcon" alt="" class="catalog-scroll-top-icon" aria-hidden="true" />
            </template>
            Remonter
          </UiPillButton>

          <div v-else class="catalog-map-zoom-control" aria-label="Controle de zoom carte">
            <UiPillButton
              class="catalog-map-zoom-button"
              variant="default"
              size="md"
              @click="zoomMapIn"
            >
              <template #leading>
                <img :src="zoomInIcon" alt="" class="catalog-map-zoom-icon" aria-hidden="true" />
              </template>
              <span v-if="!isMobileViewport">Zoomer</span>
            </UiPillButton>

            <UiPillButton
              class="catalog-map-zoom-button"
              variant="default"
              size="md"
              @click="zoomMapOut"
            >
              <template #leading>
                <img :src="zoomOutIcon" alt="" class="catalog-map-zoom-icon" aria-hidden="true" />
              </template>
              <span v-if="!isMobileViewport">Dézoomer</span>
            </UiPillButton>
          </div>
        </div>

        <div class="catalog-bottom-slot catalog-bottom-slot--center">
          <UiPillButton
            class="catalog-bottom-action"
            variant="default"
            @click="toggleCatalogViewMode"
          >
            <template #leading>
              <svg v-if="isMapView" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 5h16v14H4V5zm2 2v10h12V7H6zm1 1h4v3H7V8zm0 5h10v2H7v-2z" fill="currentColor"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2a7 7 0 0 0-7 7c0 4.67 5.42 10.62 6.03 11.28a1.32 1.32 0 0 0 1.94 0C13.58 19.62 19 13.67 19 9a7 7 0 0 0-7-7zm0 9.25A2.25 2.25 0 1 1 12 6.75a2.25 2.25 0 0 1 0 4.5z" fill="currentColor"/>
              </svg>
            </template>
            {{ catalogViewToggleLabel }}
          </UiPillButton>
        </div>

        <div class="catalog-bottom-slot catalog-bottom-slot--right">
          <UiPillButton
            class="catalog-bottom-action"
            :variant="isMobileViewport ? 'primary' : (desktopFiltersVisible ? 'primary' : 'default')"
            @click="handleBottomFiltersAction"
          >
            <template #leading>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 5h18v2H3zm4 6h10v2H7zm3 6h4v2h-4z" fill="currentColor"/>
              </svg>
            </template>
            Filtres
          </UiPillButton>
        </div>
      </div>
    </section>

    <UiModalShell
      v-if="isFiltersOpen && isMobileViewport"
      compact
      hide-header
      :use-scroll-container="false"
      @close="closeMobileFilters"
    >
      <div class="mobile-filter-shell">
        <div class="catalog-sidebar-floating-actions catalog-sidebar-floating-actions--mobile">
          <div
            class="catalog-sidebar-primary-actions"
            :class="{ 'catalog-sidebar-primary-actions--single': activeFilterCount === 0 }"
          >
            <UiFloatingTextLabel class="catalog-sidebar-results-label" truncate>
              {{ sidebarResultLabel }}
            </UiFloatingTextLabel>

            <UiButtonCore
              v-if="activeFilterCount > 0"
              class="catalog-filters-clear catalog-filters-clear--mobile"
              variant="primary"
              size="sm"
              type="button"
              @click="clearAllFilters"
            >
              <template #leading>
                <img :src="removeFiltersIcon" alt="" class="catalog-filters-clear-icon" aria-hidden="true" />
              </template>
              Retirer les filtres
            </UiButtonCore>
          </div>

          <UiIconButton
            class="catalog-sidebar-close modal-close-button"
            variant="surface-light"
            label="Fermer les filtres"
            size="md"
            @click="closeMobileFilters"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18.3 5.71L12 12l6.3 6.29-1.41 1.41L10.59 13.41 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29l6.3 6.3 6.29-6.3z" fill="currentColor"/>
            </svg>
          </UiIconButton>
        </div>

        <UiScrollContainer
          class="mobile-filter-scroll"
          bottom-inset-scrollbar="calc(var(--space-5) + env(safe-area-inset-bottom))"
          bottom-inset-content="calc(var(--space-5) + env(safe-area-inset-bottom))"
        >
          <div class="mobile-filter-view">
            <ListingFilters
              v-model="catalogFilters"
              :options="catalogFilterOptions"
            />
          </div>
        </UiScrollContainer>
      </div>
    </UiModalShell>
  </div>
</template>

<style scoped>
.catalog-page {
  display: grid;
  grid-template-columns: min(28rem, 40vw) minmax(0, 1fr);
  height: calc(100dvh - var(--header-height));
  padding: 0;
  overflow: hidden;
  margin: 0;
  align-items: stretch;
  gap: 0;
}

.catalog-page--filters-collapsed {
  grid-template-columns: minmax(0, 1fr);
}

.catalog-sidebar-shell {
  position: relative;
  min-height: 0;
}

.catalog-sidebar {
  height: 100%;
  min-height: 0;
  padding: 0;
}

.catalog-sidebar-content {
  min-height: 100%;
  box-sizing: border-box;
  padding: 0 var(--catalog-sidebar-padding-inline);
}

.catalog-sidebar-floating-actions {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-surface-raised);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--catalog-control-gap);
  box-sizing: border-box;
  padding: var(--floating-offset) var(--catalog-sidebar-padding-inline) var(--floating-offset);
  background: var(--floating-surface-fade-top);
  pointer-events: none;
}

.catalog-sidebar-primary-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: stretch;
  gap: var(--catalog-control-gap);
  min-width: 0;
}

.catalog-sidebar-primary-actions--single {
  grid-template-columns: minmax(0, 1fr);
}

.catalog-sidebar-floating-actions > * {
  pointer-events: auto;
  min-width: 0;
}

.catalog-sidebar-primary-actions > * {
  min-width: 0;
  width: 100%;
}

.catalog-sidebar-results-label {
  background: var(--color-bg);
  color: var(--color-text-light);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  backdrop-filter: none;
  justify-content: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.catalog-filters-clear {
  --ui-button-padding-inline: 0.85rem;
}

.catalog-filters-clear-icon {
  display: block;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.catalog-filters-clear--desktop {
  position: static;
  z-index: auto;
  margin-left: 0;
  width: 100%;
}

.catalog-sidebar-close {
  justify-self: end;
  align-self: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-md);
}

.catalog-main {
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-left: 1px solid var(--color-border);
  --catalog-toolbar-height: calc(var(--input-height) + (var(--space-4) * 2));
  --catalog-bottom-bar-padding-bottom: var(--floating-offset);
  --catalog-bottom-bar-height: calc(var(--btn-height) + var(--floating-offset) + var(--catalog-bottom-bar-padding-bottom));
}

.catalog-page--filters-collapsed .catalog-main {
  border-left: none;
}

.catalog-toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--catalog-control-gap);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-catalog-toolbar);
  padding: var(--floating-offset) var(--page-gutter-safe-inline-end) var(--floating-offset) var(--page-gutter-safe-inline-start);
  margin-bottom: 0;
  background: var(--floating-surface-fade-top);
  border-bottom: none;
}

.catalog-toolbar :deep(.sort-bar) {
  margin-left: auto;
}

.catalog-toolbar :deep(.search-panel),
.catalog-toolbar :deep(.pill-btn) {
  box-shadow: var(--shadow-md);
}

.catalog-search {
  flex: 1;
  min-width: 0;
}

.catalog-bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--floating-offset) var(--page-gutter-safe-inline-end) var(--catalog-bottom-bar-padding-bottom) var(--page-gutter-safe-inline-start);
  z-index: var(--z-catalog-bottom-bar);
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: end;
  gap: var(--catalog-control-gap);
  background: var(--floating-surface-fade-bottom);
}

.catalog-bottom-slot {
  min-width: 0;
  display: flex;
}

.catalog-bottom-slot--left {
  justify-content: flex-start;
}

.catalog-bottom-slot--center {
  justify-content: center;
}

.catalog-bottom-slot--right {
  justify-content: flex-end;
}

.catalog-bottom-action {
  box-shadow: var(--floating-panel-shadow);
}

.catalog-map-zoom-control {
  display: inline-flex;
  align-items: center;
  gap: var(--floating-toolbar-gap);
}

.catalog-map-zoom-button {
  flex: 0 0 auto;
  --ui-button-shadow: var(--shadow-lg);
}

.catalog-map-zoom-icon {
  display: block;
  width: 16px;
  height: 16px;
}

.catalog-bottom-action--hidden {
  visibility: hidden;
  pointer-events: none;
}

.catalog-results {
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
  min-height: 0;
  padding: 0;
}

.catalog-scroll-top-icon {
  display: block;
  width: 16px;
  height: 16px;
}

.catalog-results-content {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  box-sizing: border-box;
  padding: 0 var(--page-gutter-safe-inline-end) 0 var(--page-gutter-safe-inline-start);
}

.catalog-map-shell {
  display: flex;
  flex: 1;
  position: relative;
  z-index: var(--z-surface-base);
  isolation: isolate;
  min-height: 0;
  box-sizing: border-box;
}

.catalog-map-shell > * {
  flex: 1;
  min-height: 0;
}

@media (max-width: 1024px) {
  .catalog-page {
    grid-template-columns: 1fr;
    height: calc(100dvh - var(--header-height));
  }

  .catalog-sidebar {
    display: none;
  }

  .catalog-sidebar-shell {
    display: none;
  }

  .catalog-main {
    border-left: none;
    --catalog-toolbar-height: calc(var(--input-height) + var(--btn-height) + (var(--space-3) * 2));
    --catalog-bottom-bar-padding-bottom: max(var(--floating-offset), env(safe-area-inset-bottom));
  }

  .catalog-toolbar {
    flex-direction: column;
    align-items: stretch;
    position: fixed;
    top: var(--header-height);
    left: 0;
    right: 0;
    padding: var(--floating-offset-compact) var(--page-gutter-safe-inline-end) var(--floating-offset-compact) var(--page-gutter-safe-inline-start);
  }

  .catalog-toolbar :deep(.sort-bar) {
    order: 1;
    margin-left: 0;
  }

  .catalog-toolbar .catalog-search {
    order: 2;
  }

  .catalog-map-shell {
    padding: var(--catalog-toolbar-height) var(--page-gutter-safe-inline-end) var(--catalog-bottom-bar-height) var(--page-gutter-safe-inline-start);
  }

  .catalog-bottom-bar {
    position: fixed;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--floating-toolbar-gap);
  }

  .catalog-bottom-slot {
    justify-content: stretch;
  }

  .catalog-bottom-action {
    width: 100%;
    justify-content: center;
  }

  .catalog-map-zoom-control {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    justify-content: stretch;
    width: 100%;
    max-width: none;
    margin: 0 auto;
  }

  .catalog-map-zoom-button {
    width: 100%;
    justify-content: center;
    --ui-button-gap: 0;
  }

  .catalog-map-zoom-button :deep(.ui-button-core__content) {
    display: none;
  }

  .catalog-filters-clear--mobile {
    --ui-button-padding-inline: 0.75rem;
  }

  .mobile-filter-shell {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .catalog-sidebar-floating-actions--mobile {
    position: relative;
    top: auto;
    left: auto;
    right: auto;
    padding: var(--floating-offset) var(--page-gutter-safe-inline-end) 0 var(--page-gutter-safe-inline-start);
    background: none;
    pointer-events: auto;
  }

  .mobile-filter-scroll {
    height: 100%;
    min-height: 0;
    padding: 0;
  }

  .mobile-filter-view {
    min-height: 100%;
    box-sizing: border-box;
    padding: var(--floating-offset) var(--page-gutter-safe-inline-end) 0 var(--page-gutter-safe-inline-start);
  }
}

@media (min-width: 1025px) {
  .mobile-filter-shell,
  .mobile-filter-view {
    display: none;
  }
}
</style>
