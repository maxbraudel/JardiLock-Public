<script setup lang="ts">
import { computed, type PropType } from 'vue'
import type { ListingDetails } from '~/types/domain'

const props = defineProps({
  listing: { type: Object as PropType<ListingDetails>, required: true }
})

const formattedPrice = computed(() => {
  return (props.listing.price_cents / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }) + ' €'
})

const deposit = computed(() => {
  if (!props.listing.deposit_cents) return null
  return (props.listing.deposit_cents / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }) + ' €'
})

const schedule = computed(() => {
  const sched = props.listing.effective_schedule
  if (!sched || !Array.isArray(sched)) return null
  const openDays = sched.filter((day) => day.is_open && day.hours?.length)
  if (openDays.length === 0) return null
  // Show the most common time range as a summary
  const first = openDays[0].hours[0]
  return `${first.LDT_open_time} - ${first.LDT_close_time}`
})

const hasDescriptionSection = computed(() => {
  return Boolean(props.listing.description)
})

// Info items with SVG icon paths
const infoItems = computed(() => {
  const items = [
    { icon: 'area', label: 'Superficie', value: props.listing.area_m2 ? `${props.listing.area_m2} m²` : null },
    { icon: 'capacity', label: 'Capacité', value: props.listing.capacity ? `${props.listing.capacity} personnes` : null },
    { icon: 'schedule', label: 'Horaires', value: schedule.value },
    { icon: 'pets', label: 'Animaux', value: props.listing.animals_allowed ? 'Acceptés' : 'Non acceptés' },
    { icon: 'water', label: "Point d'eau", value: props.listing.water_point ? 'Oui' : 'Non' },
    { icon: 'light', label: 'Éclairage', value: props.listing.night_lighting ? 'Oui' : 'Non' },
    { icon: 'accessible', label: 'PMR', value: props.listing.wheelchair_accessible ? 'Accessible' : 'Non accessible' }
  ]
  return items.filter(item => item.value !== null)
})
</script>

<template>
  <div class="listing-detail">
    <section class="detail-summary">
      <div class="detail-header">
        <h1>{{ listing.title }}</h1>
        <p v-if="listing.author?.display_name" class="detail-host-mobile">{{ listing.author.display_name }}</p>
        <p v-if="listing.address" class="detail-address">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/></svg>
          {{ listing.address }}
        </p>
      </div>

      <div class="detail-price-bar">
        <span class="detail-price">{{ formattedPrice }}</span>
        <span class="detail-price-unit">/ jour</span>
        <span v-if="deposit" class="detail-deposit">Caution : {{ deposit }}</span>
      </div>
    </section>

    <section v-if="hasDescriptionSection" class="detail-section-block detail-description-section">
      <div v-if="listing.description" class="detail-description">
        <h2>Description</h2>
        <p>{{ listing.description }}</p>
      </div>
    </section>

    <div v-if="hasDescriptionSection" class="detail-section-divider" aria-hidden="true"></div>

    <section class="detail-section-block detail-characteristics-section">
      <div class="detail-section-header">
        <h2>Caractéristiques</h2>
      </div>

      <div class="detail-info-grid">
        <div
          v-for="item in infoItems"
          :key="item.label"
          class="info-card"
        >
          <span class="info-icon">
            <!-- Area -->
            <svg v-if="item.icon === 'area'" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 12h-2v3h-3v2h5v-5zM7 9h3V7H5v5h2V9zm14-6H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.99h18v14.02z" fill="var(--color-primary)"/></svg>
            <!-- Capacity -->
            <svg v-else-if="item.icon === 'capacity'" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="var(--color-primary)"/></svg>
            <!-- Schedule -->
            <svg v-else-if="item.icon === 'schedule'" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" fill="var(--color-primary)"/></svg>
            <!-- Pets -->
            <svg v-else-if="item.icon === 'pets'" width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="4.5" cy="9.5" r="2.5" fill="var(--color-primary)"/><circle cx="9" cy="5.5" r="2.5" fill="var(--color-primary)"/><circle cx="15" cy="5.5" r="2.5" fill="var(--color-primary)"/><circle cx="19.5" cy="9.5" r="2.5" fill="var(--color-primary)"/><path d="M17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02 1.02 2.03 2.33 2.32.73.15 3.06-.44 5.54-.44h.18c2.48 0 4.81.58 5.54.44 1.31-.29 2.04-1.31 2.33-2.32.31-2.04-1.3-3.49-2.61-4.8z" fill="var(--color-primary)"/></svg>
            <!-- Water -->
            <svg v-else-if="item.icon === 'water'" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" fill="var(--color-primary)"/></svg>
            <!-- Light -->
            <svg v-else-if="item.icon === 'light'" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" fill="var(--color-primary)"/></svg>
            <!-- Accessible -->
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="4" r="2" fill="var(--color-primary)"/><path d="M19 13v-2c-1.54.02-3.09-.75-4.07-1.83l-1.29-1.43c-.17-.19-.38-.34-.61-.45-.01 0-.01-.01-.02-.01H13c-.35-.2-.75-.3-1.19-.26C10.76 7.11 10 8.04 10 9.09V15c0 1.1.9 2 2 2h5v5h2v-5.5c0-1.1-.9-2-2-2h-3v-3.45c1.29 1.07 3.25 1.94 5 1.95zm-6.17 5c-.41 1.16-1.52 2-2.83 2-1.66 0-3-1.34-3-3 0-1.31.84-2.41 2-2.83V12.1c-2.28.46-4 2.48-4 4.9 0 2.76 2.24 5 5 5 2.42 0 4.44-1.72 4.9-4h-2.07z" fill="var(--color-primary)"/></svg>
          </span>
          <span class="info-label">{{ item.label }}</span>
          <span class="info-value">{{ item.value }}</span>
        </div>
      </div>

      <div v-if="listing.cancellation_policy" class="detail-policy">
        <h3>Conditions d'annulation</h3>
        <p>{{ listing.cancellation_policy }}</p>
      </div>

      <ListingTags v-if="listing.tags" :tags="listing.tags" :show-title="false" />
    </section>
  </div>
</template>

<style scoped>
.listing-detail {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  width: 100%;
}

.detail-summary,
.detail-section-block {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.detail-section-divider {
  flex: 0 0 1px;
  width: 100%;
  background: var(--color-border);
}

.detail-header h1 {
  margin-bottom: 0.25rem;
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  overflow-wrap: anywhere;
  word-break: break-word;
}

.detail-address {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--color-text-light);
  font-size: 0.95rem;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.detail-host-mobile {
  display: none;
  margin: 0;
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: var(--font-weight-semi-bold);
}

.detail-price-bar {
  display: none;
  align-items: baseline;
  gap: 0.35rem;
  padding: 1rem 1.25rem;
  background: var(--color-bg-alt);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.detail-price {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-primary);
}

.detail-price-unit {
  font-size: 0.95rem;
  color: var(--color-text-light);
}

.detail-deposit {
  margin-left: auto;
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.detail-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-alt);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.info-icon {
  display: flex;
  align-items: center;
}

.info-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.info-value {
  font-weight: var(--font-weight-semi-bold);
  font-size: 0.95rem;
}

.detail-description {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.detail-description h2 {
  font-size: 1.15rem;
}

.detail-description p {
  white-space: pre-line;
  line-height: 1.7;
  color: var(--color-text);
  overflow-wrap: anywhere;
  word-break: break-word;
}

.detail-section-header h2 {
  margin: 0;
  font-size: 1.15rem;
}

.detail-policy {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 1rem 1.25rem;
  background: var(--color-bg-alt);
  border-left: 3px solid var(--color-warning);
}

.detail-policy h3 {
  font-size: 1rem;
}

.detail-policy p {
  font-size: 0.9rem;
  color: var(--color-text-light);
  overflow-wrap: anywhere;
  word-break: break-word;
}

.info-value {
  overflow-wrap: anywhere;
  word-break: break-word;
}

@media (min-width: 768px) {
  .detail-info-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1024px) {
  .detail-host-mobile {
    display: block;
  }

  .detail-price-bar {
    display: flex;
    flex-wrap: wrap;
    padding: 0.85rem 1rem;
  }

  .detail-deposit {
    margin-left: 0;
    width: 100%;
  }
}
</style>
