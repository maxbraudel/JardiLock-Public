<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  description: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const checkboxId = computed(() =>
  `checkbox-${(props.label || props.description || Math.random().toString(36).slice(2)).toLowerCase().replace(/\s+/g, '-')}`
)
</script>

<template>
  <div class="ui-checkbox" :class="{ 'ui-checkbox--disabled': disabled }">
    <label :for="checkboxId" class="ui-checkbox__label">
      <input
        :id="checkboxId"
        type="checkbox"
        class="ui-checkbox__native"
        :checked="modelValue"
        :disabled="disabled"
        @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />

      <span class="ui-checkbox__indicator" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6.2L4.45 8.5L10 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>

      <span class="ui-checkbox__content">
        <span v-if="label || $slots.default" class="ui-checkbox__text">
          <slot>{{ label }}</slot>
        </span>
        <span v-if="description" class="ui-checkbox__description">{{ description }}</span>
      </span>
    </label>
  </div>
</template>

<style scoped>
.ui-checkbox {
  display: flex;
}

.ui-checkbox--disabled {
  opacity: 0.6;
}

.ui-checkbox__label {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  color: var(--color-text);
}

.ui-checkbox__native {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.ui-checkbox__indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.125rem;
  height: 1.125rem;
  margin-top: 0.1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.35rem;
  background: var(--color-bg);
  color: white;
  transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  flex-shrink: 0;
}

.ui-checkbox__indicator svg {
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.ui-checkbox__native:focus-visible + .ui-checkbox__indicator {
  box-shadow: var(--btn-focus-ring);
}

.ui-checkbox__native:checked + .ui-checkbox__indicator {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.ui-checkbox__native:checked + .ui-checkbox__indicator svg {
  opacity: 1;
  transform: scale(1);
}

.ui-checkbox__native:disabled + .ui-checkbox__indicator,
.ui-checkbox__native:disabled ~ .ui-checkbox__content {
  cursor: not-allowed;
}

.ui-checkbox__content {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.ui-checkbox__text {
  font-size: 0.9rem;
  line-height: 1.4;
}

.ui-checkbox__description {
  color: var(--color-text-light);
  font-size: 0.8rem;
  line-height: 1.35;
}
</style>