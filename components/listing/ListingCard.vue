<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { useFavorites } from '~/composables/useFavorites'
import { resolveApiAssetUrl } from '~/services/api'

const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true },
  priceCents: { type: Number, required: true },
  currency: { type: String, default: 'EUR' },
  thumbnail: { type: String as PropType<string | null>, default: null },
  areaM2: { type: Number, default: 0 },
  capacity: { type: Number, default: 0 },
  address: { type: String, default: '' },
  tags: { type: Array as () => string[], default: () => [] },
  imageAspectRatio: { type: Number, default: 2 / 3 },
  imageLoading: { type: String as PropType<'lazy' | 'eager'>, default: 'lazy' },
  imageFetchPriority: { type: String as PropType<'auto' | 'high' | 'low'>, default: 'auto' }
})

const emit = defineEmits(['toggleFavorite'])

const { isFavorite, toggleFavorite } = useFavorites()
const favoriteButtonActive = computed(() => isFavorite(props.id))

const thumbnailUrl = computed(() => resolveApiAssetUrl(props.thumbnail))

const cardImagePadding = computed(() => {
  const clampedAspectRatio = Math.max(0.4, Math.min(1, props.imageAspectRatio))
  return `${(clampedAspectRatio * 100).toFixed(3)}%`
})

function handleFavoriteClick(event: MouseEvent) {
  event.stopPropagation()
  event.preventDefault()
  toggleFavorite(props.id)
  emit('toggleFavorite', props.id)
}
</script>

<template>
  <NuxtLink :to="`/gardens#listing=${encodeURIComponent(slug)}`" class="listing-card">
    <div class="card-image-wrapper" :style="{ paddingBottom: cardImagePadding }">
      <img
        v-if="thumbnail"
        :src="thumbnailUrl"
        :alt="title"
        :loading="imageLoading"
        :fetchpriority="imageFetchPriority"
        decoding="async"
      />
      <div v-else class="card-image-placeholder">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z" fill="currentColor"/></svg>
      </div>
      <UiPriceBadge class="card-price-badge" :price-cents="priceCents" variant="overlay" size="sm" suffix="/ j" />
      <UiIconButton
        size="md"
        variant="surface-light"
        class="favorite-btn"
        :class="{ active: favoriteButtonActive }"
        :label="favoriteButtonActive ? 'Retirer des favoris' : 'Ajouter aux favoris'"
        @click="handleFavoriteClick"
      >
        <svg v-if="favoriteButtonActive" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </UiIconButton>
    </div>

    <div class="card-body">
      <h3 class="card-title">{{ title }}</h3>
      <p v-if="address" class="card-address">{{ address }}</p>
    </div>
  </NuxtLink>
</template>

<style scoped>
.listing-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  text-decoration: none;
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
}

/* 3:2 aspect ratio image container */
.card-image-wrapper {
  position: relative;
  padding-bottom: 66.667%;
  overflow: hidden;
  background: var(--color-bg-dark);
}

.card-image-wrapper img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-image-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-dark);
  color: var(--color-text-muted);
}

.card-price-badge {
  position: absolute;
  bottom: 0.6rem;
  right: 0.6rem;
}

/* Favorite button */
.favorite-btn {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
}

.favorite-btn.active {
  color: var(--color-primary);
}

/* Card body — simplified */
.card-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--space-1);
  padding: 0.75rem 0.85rem;
  overflow: hidden;
}

.card-title {
  font-size: 0.95rem;
  font-weight: var(--font-weight-semi-bold);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-address {
  font-size: 0.8rem;
  color: var(--color-text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
