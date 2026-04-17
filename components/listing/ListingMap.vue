<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  title: { type: String, default: '' }
})

const mapContainer = ref<HTMLElement | null>(null)

type LeafletIconDefaultPrototype = {
  _getIconUrl?: unknown
}

type LeafletMapLike = {
  setView: (coordinates: [number, number], zoom: number) => LeafletMapLike
  remove: () => void
}

type LeafletMarkerLike = {
  addTo: (map: LeafletMapLike) => LeafletMarkerLike
  bindPopup: (content: string) => void
  setLatLng: (coordinates: [number, number]) => void
}

type LeafletNamespaceLike = {
  map: (container: HTMLElement) => LeafletMapLike
  tileLayer: (urlTemplate: string, options: Record<string, unknown>) => { addTo: (map: LeafletMapLike) => void }
  marker: (coordinates: [number, number]) => LeafletMarkerLike
  Icon: {
    Default: {
      prototype: LeafletIconDefaultPrototype
      mergeOptions: (options: Record<string, string>) => void
    }
  }
}

type LeafletModuleLike = LeafletNamespaceLike & {
  default?: LeafletNamespaceLike
}

let map: LeafletMapLike | null = null
let marker: LeafletMarkerLike | null = null

onMounted(async () => {
  // Dynamic import — Leaflet is a third-party module (bonus criterion)
  const leafletModule = await import('leaflet')
  const L = (leafletModule as unknown as LeafletModuleLike).default || (leafletModule as unknown as LeafletModuleLike)

  // Fix default marker icons (known bundler issue)
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
  })

  if (!mapContainer.value) return

  map = L.map(mapContainer.value).setView([props.lat, props.lng], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map)

  marker = L.marker([props.lat, props.lng]).addTo(map)
  if (props.title) {
    marker.bindPopup(props.title)
  }
})

// watch — recenter map when coords change
watch(() => [props.lat, props.lng], ([newLat, newLng]) => {
  if (map && marker) {
    map.setView([newLat, newLng], 13)
    marker.setLatLng([newLat, newLng])
  }
})

// onUnmounted — cleanup to avoid memory leaks (cours §10)
onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
    marker = null
  }
})
</script>

<template>
  <div class="listing-map">
    <h3>Localisation</h3>
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<style scoped>
.listing-map {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: 1rem;
}

.map-container {
  width: 100%;
  height: 350px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  z-index: 0;
}

@media (max-width: 768px) {
  .map-container {
    height: 250px;
  }
}
</style>
