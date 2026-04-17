<script setup lang="ts">
import { computed, type PropType } from 'vue'

type SelectOption = {
  value: string | number
  label: string
  disabled?: boolean
}

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  options: { type: Array as PropType<SelectOption[]>, default: () => [] },
  placeholder: { type: String, default: 'Sélectionner...' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const selectId = computed(() =>
  `select-${(props.label || props.placeholder || Math.random().toString(36).slice(2)).toLowerCase().replace(/\s+/g, '-')}`
)
</script>

<template>
  <div class="ui-select" :class="{ 'ui-select--error': error, 'ui-select--disabled': disabled }">
    <label v-if="label" :for="selectId" class="ui-select__label">
      {{ label }}
      <span v-if="required" class="ui-select__required">*</span>
    </label>

    <UiInputFrame :error="Boolean(error)" :disabled="disabled">
      <select
        :id="selectId"
        :value="modelValue"
        :required="required"
        :disabled="disabled"
        class="ui-select__field"
        @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <option value="" :disabled="required">{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>

      <template #trailing>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 4.5L6 8L10 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </template>
    </UiInputFrame>

    <span v-if="error" class="ui-select__error">{{ error }}</span>
  </div>
</template>

<style scoped>
.ui-select {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.ui-select__label {
  font-size: 0.875rem;
  font-weight: var(--font-weight-semi-bold);
  color: var(--color-text);
}

.ui-select__required {
  color: var(--color-danger);
}

.ui-select__field {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: 0.875rem;
  line-height: calc(var(--input-height) - 2px);
  padding: 0;
  appearance: none;
  cursor: pointer;
}

.ui-select__field:disabled {
  cursor: not-allowed;
}

.ui-select__error {
  font-size: 0.8rem;
  color: var(--color-danger);
}
</style>