<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from '~/composables/useToast'

const props = defineProps({
  priceCents: { type: Number, required: true },
  depositCents: { type: Number, default: 0 },
  title: { type: String, default: '' },
  isFavorite: { type: Boolean, default: false }
})

defineEmits(['toggleFavorite'])

const { showToast } = useToast()

const formattedDeposit = computed(() => {
  if (!props.depositCents) return null
  return (props.depositCents / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }) + ' €'
})

function handleBookingClick() {
  const listingLabel = props.title.trim()
  const message = listingLabel
    ? `La reservation de "${listingLabel}" sera disponible plus tard.`
    : 'La reservation sera disponible plus tard.'

  showToast(message)
}
</script>

<template>
  <div class="booking-panel">
    <div class="booking-price-block">
      <UiPriceBadge :price-cents="priceCents" size="lg" suffix="/ jour" />

      <p v-if="formattedDeposit" class="booking-deposit">
        Caution : {{ formattedDeposit }}
      </p>
    </div>

    <UiButton variant="surface-light" block class="save-btn" :class="{ 'favorite-btn--active': isFavorite }" @click="$emit('toggleFavorite')">
      <template #leading>
        <svg v-if="isFavorite" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </template>
      {{ isFavorite ? 'Retirer des favoris' : 'Sauvegarder' }}
    </UiButton>

    <UiButton block class="booking-btn" @click="handleBookingClick">
      Réserver maintenant
    </UiButton>
  </div>
</template>

<style scoped>
.booking-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

:deep(.save-btn) {
  --ui-button-fg: var(--color-text);
  --ui-button-bg: var(--color-bg);
  --ui-button-border: var(--color-border);
}

:deep(.save-btn.favorite-btn--active) {
  --ui-button-fg: var(--color-primary);
}

.booking-deposit {
  margin-top: var(--space-1);
  font-size: 0.9rem;
  color: var(--color-text-light);
  text-align: left;
}

.booking-notice {
  margin-top: var(--space-2);
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-align: center;
}

@media (max-width: 1024px) {
  .booking-panel {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 5;
    padding: 0.75rem 1rem calc(0.9rem + env(safe-area-inset-bottom));
    background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.92) 18%, rgba(255, 255, 255, 1) 100%);
    border: none;
    border-radius: 0;
    box-shadow: none;
  }

  .booking-price-block,
  .booking-deposit {
    display: none;
  }

  .favorite-btn,
  .booking-btn {
    box-shadow: var(--shadow-md);
  }

  :deep(.save-btn) {
    margin-bottom: var(--space-3);
    --ui-button-bg: rgba(255, 255, 255, 0.96);
  }
}
</style>
