<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useListingCatalogMap } from '~/composables/useListingCatalogMap'
import type { ListingMapItem, MapViewportInsets } from '~/utils/listingCatalogMap'

const props = defineProps({
  listings: { type: Array as () => ListingMapItem[], default: () => [] },
  active: { type: Boolean, default: true },
  viewportInsets: {
    type: Object as () => MapViewportInsets,
    default: () => ({ top: 0, bottom: 0 })
  }
})

const mapContainer = ref<HTMLElement | null>(null)
const { geolocatedListings, zoomIn, zoomOut } = useListingCatalogMap({
  active: toRef(props, 'active'),
  listings: toRef(props, 'listings'),
  mapContainer,
  viewportInsets: toRef(props, 'viewportInsets')
})

defineExpose({
  zoomIn,
  zoomOut
})
</script>

<template>
  <div class="listing-catalog-map">
    <div ref="mapContainer" class="listing-catalog-map-canvas"></div>

    <div v-if="geolocatedListings.length === 0" class="listing-catalog-map-empty">
      Aucune annonce geolocalisee ne correspond aux filtres.
    </div>
  </div>
</template>

<style scoped>
.listing-catalog-map {
  position: relative;
  z-index: var(--z-surface-base);
  isolation: isolate;
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: #edf2f7;
}

.listing-catalog-map-canvas {
  width: 100%;
  height: 100%;
}

:deep(.leaflet-tile-pane) {
  filter: brightness(var(--catalog-map-tile-brightness));
}

.listing-catalog-map-empty {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 0.7rem 1rem;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.92);
  color: var(--color-text-light);
  font-size: 0.9rem;
  font-weight: var(--font-weight-semi-bold);
  text-align: center;
  box-shadow: var(--shadow-md);
  z-index: var(--z-map-overlay);
}

:deep(.catalog-map-price-icon-wrapper) {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: default;
  opacity: 1;
  transition: transform 0.3s ease-out, opacity 0.3s ease-in;
}

:deep(.catalog-map-cluster-icon-wrapper) {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 1;
  transition: transform 0.3s ease-out, opacity 0.3s ease-in;
}

:deep(.catalog-map-marker-chip) {
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  height: 34px;
  padding: 0 0.62rem;
  border-radius: 999px;
  background-color: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  font-size: 0.82rem;
  font-weight: 700;
  box-shadow: var(--shadow-md);
  white-space: nowrap;
  will-change: transform;
  transform: translateZ(0);
  transition:
    opacity var(--catalog-overlay-active-transition-duration) var(--catalog-overlay-active-transition-easing),
}

:deep(.catalog-map-marker-group) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: max-content;
  flex-direction: column;
  max-width: none;
}

:deep(.catalog-map-marker-chip[data-listing-slug]) {
  cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
  :deep(.catalog-map-marker-chip[data-listing-slug]:hover),
  :deep(.catalog-map-cluster-icon-wrapper:hover .catalog-map-marker-chip) {
    background-color: var(--btn-surface-hover-bg);
    border-color: var(--btn-surface-hover-border);
  }
}

:deep(.catalog-map-marker-chip[data-listing-slug]:active),
:deep(.catalog-map-cluster-icon-wrapper:active .catalog-map-marker-chip) {
  background-color: var(--btn-surface-hover-bg);
  border-color: var(--btn-surface-hover-border);
}

:deep(.catalog-map-marker-chip__icon) {
  width: 1rem;
  height: 1rem;
  flex: 0 0 auto;
  display: block;
}

:deep(.catalog-map-marker-chip__label) {
  display: block;
  line-height: 1;
}

/* Shorten Leaflet's zoom-animation lock window (default: 250ms → 150ms).
   _animatingZoom blocks all interactions until transitionend fires. */
:deep(.leaflet-zoom-anim .leaflet-zoom-animated) {
  transition-duration: 0.15s !important;
}
</style>
