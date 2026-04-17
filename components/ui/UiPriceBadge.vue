<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  priceCents: { type: Number, required: true },
  currency: { type: String, default: 'EUR' },
  suffix: { type: String, default: '' },
  variant: { type: String, default: 'inline' },
  size: { type: String, default: 'md' }
})

const formattedPrice = computed(() => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: props.currency,
    maximumFractionDigits: 0
  }).format(props.priceCents / 100)
})
</script>

<template>
  <span class="ui-price-badge" :class="[`variant-${props.variant}`, `size-${props.size}`]">
    <span class="ui-price-badge__amount">{{ formattedPrice }}</span>
    <span v-if="suffix" class="ui-price-badge__suffix">{{ suffix }}</span>
  </span>
</template>

<style scoped>
.ui-price-badge {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  white-space: nowrap;
}

.ui-price-badge__amount {
  font-weight: 800;
}

.ui-price-badge__suffix {
  color: inherit;
}

.ui-price-badge.variant-inline {
  color: var(--color-primary);
}

.ui-price-badge.variant-inline .ui-price-badge__suffix {
  color: var(--color-text-light);
}

.ui-price-badge.variant-overlay {
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-md);
  background: rgba(0, 0, 0, 0.72);
  color: white;
}

.ui-price-badge.size-sm {
  font-size: 0.85rem;
}

.ui-price-badge.size-sm .ui-price-badge__suffix {
  font-size: 0.82em;
}

.ui-price-badge.size-md {
  font-size: 1.1rem;
}

.ui-price-badge.size-lg {
  font-size: 1.75rem;
}

.ui-price-badge.size-lg .ui-price-badge__suffix {
  font-size: 0.54em;
}
</style>