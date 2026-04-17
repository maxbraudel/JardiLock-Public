<script setup lang="ts">
import { computed, type PropType } from 'vue'

type ButtonType = 'button' | 'submit' | 'reset'

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  shape: { type: String, default: 'pill' },
  type: { type: String as PropType<ButtonType>, default: 'button' },
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  floating: { type: Boolean, default: false }
})

const resolvedVariant = computed(() => {
  const variants = new Set([
    'primary',
    'secondary',
    'danger',
    'surface',
    'surface-light',
    'surface-dark',
    'ghost',
    'outline',
    'text',
    'danger-ghost'
  ])

  return variants.has(props.variant) ? props.variant : 'primary'
})

const resolvedShape = computed(() => {
  const shapes = new Set(['pill', 'soft', 'round'])
  return shapes.has(props.shape) ? props.shape : 'pill'
})
</script>

<template>
  <UiButtonCore
    class="ui-button"
    :variant="resolvedVariant"
    :size="props.size"
    :shape="resolvedShape"
    :type="props.type"
    :label="props.label"
    :disabled="props.disabled"
    :loading="props.loading"
    :block="props.block"
    :floating="props.floating"
  >
    <template v-if="$slots.leading" #leading>
      <slot name="leading" />
    </template>

    <slot />

    <template v-if="$slots.trailing" #trailing>
      <slot name="trailing" />
    </template>
  </UiButtonCore>
</template>

<style scoped>
.ui-button {
  --ui-button-gap: var(--btn-gap);
}

.ui-button.variant-text {
  --ui-button-padding-inline: var(--space-2);
}
</style>