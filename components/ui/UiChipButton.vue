<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  selected: { type: Boolean, default: false },
  shape: { type: String, default: 'pill' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false }
})

const resolvedVariant = computed(() => (props.selected ? 'primary' : 'surface-light'))
const resolvedShape = computed(() => (props.shape === 'soft' ? 'soft' : 'pill'))
</script>

<template>
  <UiButtonCore
    class="ui-chip-button"
    :variant="resolvedVariant"
    :size="props.size"
    :shape="resolvedShape"
    :disabled="props.disabled"
    type="button"
  >
    <slot />
  </UiButtonCore>
</template>

<style scoped>
.ui-chip-button.size-sm {
  --ui-button-height: 32px;
  --ui-button-padding-inline: 0.7rem;
  font-size: 0.78rem;
}

.ui-chip-button.size-md {
  --ui-button-height: var(--btn-height);
  --ui-button-padding-inline: 0.75rem;
  font-size: 0.8rem;
}

.ui-chip-button.size-lg {
  --ui-button-height: var(--btn-height-touch);
  --ui-button-padding-inline: 0.9rem;
  font-size: 0.875rem;
}
</style>