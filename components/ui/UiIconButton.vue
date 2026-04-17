<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  size: { type: String, default: 'md' },
  variant: { type: String, default: 'default' },
  round: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  label: { type: String, required: true }
})

const resolvedVariant = computed(() => {
  if (props.variant === 'default') return 'surface'
  if (props.variant === 'surface-light') return 'surface-light'
  if (props.variant === 'surface-dark') return 'surface-dark'
  if (props.variant === 'primary') return 'primary'
  if (props.variant === 'danger') return 'danger-ghost'
  return 'ghost'
})
</script>

<template>
  <UiButtonCore
    class="icon-btn"
    :variant="resolvedVariant"
    :size="props.size"
    :shape="props.round ? 'round' : 'soft'"
    :label="props.label"
    :disabled="props.disabled"
    type="button"
  >
    <slot />
  </UiButtonCore>
</template>

<style scoped>
.icon-btn {
  --ui-button-padding-inline: 0;
}
</style>
