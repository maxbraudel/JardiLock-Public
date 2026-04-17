<script setup lang="ts">
import type { PropType } from 'vue'
import type { ListingDetails } from '~/types/domain'

const props = defineProps({
  listing: { type: Object as PropType<ListingDetails>, required: true },
  weatherCity: { type: String, default: '' },
  isFavorite: { type: Boolean, default: false }
})

const emit = defineEmits(['toggleFavorite', 'authorProfileClick'])

function handleToggleFavorite() {
  emit('toggleFavorite')
}

function handleAuthorProfileClick() {
  emit('authorProfileClick')
}
</script>

<template>
  <div class="detail-content-shell">
    <div class="detail-layout">
      <div class="detail-main">
        <section class="detail-main-section">
          <ListingDetail :listing="props.listing" />
        </section>

        <div v-if="props.listing.latitude && props.listing.longitude" class="detail-main-divider" aria-hidden="true"></div>

        <section v-if="props.listing.latitude && props.listing.longitude" class="detail-main-section">
          <ListingMap
            :lat="props.listing.latitude"
            :lng="props.listing.longitude"
            :title="props.listing.title"
          />
        </section>

        <div v-if="props.listing.latitude && props.listing.longitude && props.weatherCity" class="detail-main-divider" aria-hidden="true"></div>

        <section v-if="props.listing.latitude && props.listing.longitude && props.weatherCity" class="detail-main-section">
          <ListingWeatherWidget
            :city="props.weatherCity"
            :latitude="props.listing.latitude"
            :longitude="props.listing.longitude"
          />
        </section>
      </div>

      <div class="detail-divider" aria-hidden="true"></div>

      <aside class="detail-sidebar">
        <div class="detail-sidebar-inner">
          <section class="detail-sidebar-section">
            <div class="author-card">
              <div class="author-avatar">
                {{ props.listing.author?.display_name?.charAt(0)?.toUpperCase() || '?' }}
              </div>
              <div class="author-meta">
                <p class="author-name">{{ props.listing.author?.display_name || 'Hôte JardiLock' }}</p>
                <button type="button" class="author-profile-link" @click="handleAuthorProfileClick">Voir profil</button>
              </div>
            </div>
          </section>

          <div class="detail-sidebar-divider" aria-hidden="true"></div>

          <section class="detail-sidebar-section">
            <ListingBookingPanel
              :price-cents="props.listing.price_cents"
              :deposit-cents="props.listing.deposit_cents || 0"
              :title="props.listing.title"
              :is-favorite="props.isFavorite"
              @toggle-favorite="handleToggleFavorite"
            />
          </section>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.detail-content-shell {
  max-width: 1240px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem var(--page-gutter) 3rem;
  box-sizing: border-box;
}

.detail-layout {
  display: flex;
  gap: 1rem;
  align-items: stretch;
}

.detail-main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1 1 auto;
  min-width: 0;
}

.detail-main-section {
  min-width: 0;
}

.detail-main-divider {
  flex: 0 0 1px;
  width: 100%;
  background: var(--color-border);
}

.detail-divider {
  flex: 0 0 1px;
  align-self: stretch;
  background: var(--color-border);
}

.detail-sidebar {
  display: flex;
  flex-direction: column;
  flex: 0 0 360px;
  width: 360px;
  align-self: stretch;
  min-width: 0;
}

.detail-sidebar-inner {
  position: sticky;
  top: 1rem;
  max-height: calc(100dvh - var(--header-height) - 2rem - env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.author-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0;
}

.detail-sidebar-section {
  min-width: 0;
}

.detail-sidebar-divider {
  flex: 0 0 1px;
  width: 100%;
  background: var(--color-border);
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}

.author-meta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.author-name {
  margin: 0;
  font-size: 0.98rem;
  font-weight: var(--font-weight-semi-bold);
  color: var(--color-text);
}

.author-profile-link {
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 0.88rem;
  color: var(--color-text-light);
  cursor: pointer;
}

.author-profile-link:hover,
.author-profile-link:focus-visible {
  color: var(--color-primary);
  outline: none;
}

.detail-main-section :deep(.weather-widget) {
  margin-top: 0;
}

@media (max-width: 1024px) {
  .detail-content-shell {
    padding: 1.5rem var(--page-gutter)
      calc((var(--btn-height) * 2) + (var(--space-4) * 2) + 0.75rem + env(safe-area-inset-bottom));
  }

  .detail-layout {
    flex-direction: column;
    gap: 0;
  }

  .detail-divider {
    display: none;
  }

  .detail-sidebar {
    flex: 0 0 0;
    width: 100%;
    height: 0;
    min-height: 0;
    overflow: visible;
  }

  .detail-sidebar-inner {
    position: static;
    gap: 0;
  }

  .author-card {
    display: none;
  }

  .detail-sidebar-divider {
    display: none;
  }
}
</style>