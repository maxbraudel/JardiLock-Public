<script setup lang="ts">
import { computed, useSlots, type PropType } from 'vue'

type ButtonType = 'button' | 'submit' | 'reset'

const props = defineProps({
  variant: { type: String, default: 'surface-light' },
  size: { type: String, default: 'md' },
  shape: { type: String, default: 'pill' },
  type: { type: String as PropType<ButtonType>, default: 'button' },
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  floating: { type: Boolean, default: false }
})

const slots = useSlots()

const hasDefaultSlot = computed(() => Boolean(slots.default))

const classes = computed(() => [
  'ui-button-core',
  `variant-${props.variant}`,
  `size-${props.size}`,
  `shape-${props.shape}`,
  {
    'is-block': props.block,
    'is-floating': props.floating,
    'is-loading': props.loading,
    'is-icon-only': !hasDefaultSlot.value
  }
])
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    :aria-label="label || undefined"
  >
    <span v-if="loading" class="ui-button-core__spinner" aria-hidden="true"></span>
    <span v-if="$slots.leading" class="ui-button-core__icon" aria-hidden="true">
      <slot name="leading" />
    </span>
    <span v-if="hasDefaultSlot" class="ui-button-core__content">
      <slot />
    </span>
    <span v-if="$slots.trailing" class="ui-button-core__icon" aria-hidden="true">
      <slot name="trailing" />
    </span>
  </button>
</template>

<style scoped>
.ui-button-core {
  --ui-button-height: var(--btn-height);
  --ui-button-padding-inline: var(--btn-padding-inline-md);
  --ui-button-radius: var(--btn-radius-pill);
  --ui-button-gap: var(--btn-gap);
  --ui-button-fg: var(--color-text);
  --ui-button-bg: transparent;
  --ui-button-border: transparent;
  --ui-button-shadow: 0 0 0 transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ui-button-gap);
  width: auto;
  min-height: var(--ui-button-height);
  height: var(--ui-button-height);
  padding-inline: var(--ui-button-padding-inline);
  border: 1px solid var(--ui-button-border);
  border-radius: var(--ui-button-radius);
  background: var(--ui-button-bg);
  box-shadow: var(--ui-button-shadow);
  color: var(--ui-button-fg);
  font: inherit;
  font-weight: var(--font-weight-semi-bold);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
}

.ui-button-core:focus-visible {
  outline: none;
  box-shadow: var(--ui-button-shadow), var(--btn-focus-ring);
}

.ui-button-core:disabled {
  opacity: var(--btn-disabled-opacity);
  cursor: not-allowed;
}

.ui-button-core.is-block {
  width: 100%;
}

.ui-button-core.is-floating {
  --ui-button-shadow: var(--shadow-md);
}

.ui-button-core.shape-pill {
  --ui-button-radius: var(--btn-radius-pill);
}

.ui-button-core.shape-soft {
  --ui-button-radius: var(--btn-radius-soft);
}

.ui-button-core.shape-round {
  --ui-button-radius: var(--btn-radius-round);
  width: var(--ui-button-height);
  padding-inline: 0;
}

.ui-button-core.size-sm {
  --ui-button-padding-inline: var(--btn-padding-inline-sm);
  font-size: 0.8rem;
}

.ui-button-core.size-md {
  --ui-button-padding-inline: var(--btn-padding-inline-md);
  font-size: 0.875rem;
}

.ui-button-core.size-lg {
  --ui-button-padding-inline: var(--btn-padding-inline-lg);
  font-size: 1rem;
}

.ui-button-core.size-touch {
  --ui-button-height: var(--btn-height-touch);
  --ui-button-padding-inline: var(--btn-padding-inline-md);
  font-size: 0.875rem;
}

.ui-button-core.size-field {
  --ui-button-height: var(--btn-height-field);
  --ui-button-padding-inline: 0;
  font-size: 0.875rem;
}

.ui-button-core.variant-primary {
  --ui-button-fg: white;
  --ui-button-bg: var(--color-primary);
}

.ui-button-core.variant-primary:hover:not(:disabled) {
  --ui-button-bg: var(--color-primary-dark);
}

.ui-button-core.variant-secondary {
  --ui-button-fg: var(--color-primary-dark);
  --ui-button-bg: var(--color-accent-light);
}

.ui-button-core.variant-secondary:hover:not(:disabled) {
  --ui-button-bg: var(--color-accent);
}

.ui-button-core.variant-danger {
  --ui-button-fg: white;
  --ui-button-bg: var(--color-danger);
}

.ui-button-core.variant-danger:hover:not(:disabled) {
  --ui-button-bg: #b91c1c;
}

.ui-button-core.variant-surface {
  --ui-button-fg: var(--color-text);
  --ui-button-bg: var(--color-bg);
  --ui-button-shadow: var(--shadow-sm);
}

.ui-button-core.variant-surface:hover:not(:disabled) {
  --ui-button-bg: var(--btn-surface-hover-bg);
  --ui-button-shadow: var(--shadow-md);
}

.ui-button-core.variant-surface-light {
  --ui-button-fg: var(--color-text);
  --ui-button-bg: var(--color-bg);
  --ui-button-border: var(--color-border);
}

.ui-button-core.variant-surface-light:hover:not(:disabled) {
  --ui-button-bg: var(--btn-surface-hover-bg);
  --ui-button-border: var(--btn-surface-hover-border);
}

.ui-button-core.variant-surface-dark {
  --ui-button-fg: white;
  --ui-button-bg: var(--btn-surface-dark-bg);
  --ui-button-border: var(--btn-surface-dark-border);
  backdrop-filter: blur(10px);
}

.ui-button-core.variant-surface-dark:hover:not(:disabled) {
  --ui-button-bg: var(--btn-surface-dark-bg-hover);
}

.ui-button-core.variant-ghost {
  --ui-button-fg: var(--color-text-light);
  --ui-button-bg: transparent;
}

.ui-button-core.variant-ghost:hover:not(:disabled) {
  --ui-button-fg: var(--color-text);
  --ui-button-bg: rgba(0, 0, 0, 0.06);
}

.ui-button-core.variant-outline {
  --ui-button-fg: var(--color-primary);
  --ui-button-bg: transparent;
  --ui-button-border: var(--color-primary);
}

.ui-button-core.variant-outline:hover:not(:disabled) {
  --ui-button-bg: var(--color-accent-light);
}

.ui-button-core.variant-text {
  --ui-button-fg: var(--color-primary);
  --ui-button-bg: transparent;
  --ui-button-border: transparent;
}

.ui-button-core.variant-text:hover:not(:disabled) {
  --ui-button-bg: var(--color-bg-alt);
}

.ui-button-core.variant-danger-ghost {
  --ui-button-fg: var(--color-danger);
  --ui-button-bg: transparent;
}

.ui-button-core.variant-danger-ghost:hover:not(:disabled) {
  --ui-button-bg: var(--color-danger-light);
}

.ui-button-core__icon,
.ui-button-core__content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ui-button-core__icon {
  flex-shrink: 0;
}

.ui-button-core__spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ui-button-spin 0.6s linear infinite !important;
}

@keyframes ui-button-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>