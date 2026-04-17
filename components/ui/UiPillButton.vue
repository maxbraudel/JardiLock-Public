<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'default' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  floating: { type: Boolean, default: false }
})

const resolvedVariant = computed(() => {
  if (props.variant === 'primary') return 'primary'
  if (props.variant === 'surface-dark') return 'surface-dark'
  return 'surface-light'
})
</script>

<template>
  <UiButtonCore
    type="button"
    class="pill-btn"
    :variant="resolvedVariant"
    :size="props.size"
    :disabled="props.disabled"
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
.pill-btn {
  --ui-button-gap: var(--btn-gap-pill);
}

.pill-btn.size-md,
.pill-btn.size-touch {
  --ui-button-padding-inline: var(--btn-padding-inline-pill);
}
</style>
