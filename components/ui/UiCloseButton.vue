<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, default: 'Fermer' },
  variant: { type: String, default: 'surface-light' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  showLabel: { type: Boolean, default: true },
  responsiveIconOnly: { type: Boolean, default: false }
})

const resolvedVariant = computed(() => {
  if (props.variant === 'surface-dark') return 'surface-dark'
  if (props.variant === 'primary') return 'primary'
  return 'surface-light'
})

const resolvedShape = computed(() => (props.showLabel ? 'pill' : 'round'))
</script>

<template>
  <UiButtonCore
    class="ui-close-button"
    :class="{ 'is-responsive-icon-only': props.responsiveIconOnly }"
    :variant="resolvedVariant"
    :size="props.size"
    :shape="resolvedShape"
    :label="props.label"
    :disabled="props.disabled"
    type="button"
  >
    <template #leading>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M18.3 5.71L12 12l6.3 6.29-1.41 1.41L10.59 13.41 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29l6.3 6.3 6.29-6.3z" fill="currentColor"/>
      </svg>
    </template>
    <span v-if="props.showLabel" class="ui-close-button__label">{{ props.label }}</span>
  </UiButtonCore>
</template>

<style scoped>
.ui-close-button {
  --ui-button-gap: var(--btn-gap-pill);
}

.ui-close-button.size-md,
.ui-close-button.size-touch {
  --ui-button-padding-inline: var(--btn-padding-inline-pill);
}

.ui-close-button__label {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .ui-close-button.is-responsive-icon-only {
    --ui-button-gap: 0;
    width: var(--ui-button-height);
    padding-inline: 0;
    border-radius: var(--btn-radius-round);
  }

  .ui-close-button.is-responsive-icon-only :deep(.ui-button-core__content) {
    display: none;
  }
}
</style>