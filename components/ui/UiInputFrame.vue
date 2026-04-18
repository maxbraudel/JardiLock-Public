<script setup lang="ts">
import { computed, useSlots } from 'vue'

const props = defineProps({
  error: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  active: { type: Boolean, default: false }
})

const slots = useSlots()

const frameClasses = computed(() => ({
  'ui-input-frame--error': props.error,
  'ui-input-frame--disabled': props.disabled,
  'ui-input-frame--active': props.active,
  'ui-input-frame--with-leading': Boolean(slots.leading),
  'ui-input-frame--with-trailing': Boolean(slots.trailing)
}))
</script>

<template>
  <div class="ui-input-frame" :class="frameClasses">
    <span v-if="$slots.leading" class="ui-input-frame__leading">
      <slot name="leading" />
    </span>

    <div class="ui-input-frame__control">
      <slot />
    </div>

    <span v-if="$slots.trailing" class="ui-input-frame__trailing">
      <slot name="trailing" />
    </span>
  </div>
</template>

<style scoped>
.ui-input-frame {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  min-height: var(--input-height);
  padding: 0 0.15rem 0 0.875rem;
  box-sizing: border-box;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 999px;
}

.ui-input-frame:focus-within,
.ui-input-frame--active {
  border-color: var(--color-primary);
  box-shadow: var(--btn-focus-ring);
}

.ui-input-frame--error {
  border-color: var(--color-danger);
}

.ui-input-frame--error:focus-within,
.ui-input-frame--error.ui-input-frame--active {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.ui-input-frame--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ui-input-frame__leading,
.ui-input-frame__trailing {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ui-input-frame__leading {
  color: var(--color-text-muted);
}

.ui-input-frame__leading :deep(svg),
.ui-input-frame__leading :deep(img) {
  display: block;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.ui-input-frame__control {
  display: flex;
  align-items: center;
  align-self: stretch;
  flex: 1;
  min-width: 0;
}
</style>