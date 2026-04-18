<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: undefined },
  clearable: { type: Boolean, default: false },
  clearLabel: { type: String, default: '' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  min: { type: [String, Number], default: undefined },
  max: { type: [String, Number], default: undefined },
  step: { type: [String, Number], default: undefined }
})

const emit = defineEmits(['update:modelValue', 'clear'])

const inputId = computed(() =>
  `input-${(props.label || props.placeholder || Math.random().toString(36).slice(2)).toLowerCase().replace(/\s+/g, '-')}`
)

const hasValue = computed(() => props.modelValue !== '' && props.modelValue !== null && props.modelValue !== undefined)
const showClearButton = computed(() => props.clearable && hasValue.value)
const resolvedClearLabel = computed(() => props.clearLabel || (props.label ? `Effacer ${props.label}` : 'Effacer'))

function handleClear() {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<template>
  <div class="ui-input" :class="{ 'ui-input--error': error, 'ui-input--disabled': disabled }">
    <label v-if="label" :for="inputId" class="ui-input__label">
      {{ label }}
      <span v-if="required" class="ui-input__required">*</span>
    </label>
    <UiInputFrame :error="Boolean(error)" :disabled="disabled">
      <template v-if="$slots.leading" #leading>
        <slot name="leading" />
      </template>

      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :required="required"
        :disabled="disabled"
        :min="min"
        :max="max"
        :step="step"
        class="ui-input__field"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />

      <template v-if="showClearButton || $slots.trailing" #trailing>
        <div class="ui-input__actions">
          <UiFieldClearButton
            v-if="showClearButton"
            class="ui-input__clear"
            :label="resolvedClearLabel"
            :disabled="disabled"
            @click="handleClear"
          />
          <slot name="trailing" />
        </div>
      </template>
    </UiInputFrame>

    <span v-if="error" class="ui-input__error">{{ error }}</span>
  </div>
</template>

<style scoped>
.ui-input {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.ui-input__label {
  font-size: 0.875rem;
  font-weight: var(--font-weight-semi-bold);
  color: var(--color-text);
}

.ui-input__required {
  color: var(--color-danger);
}

.ui-input__field {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 0.875rem;
  line-height: calc(var(--input-height) - 2px);
  color: var(--color-text);
  min-width: 0;
  padding: 0;
}

.ui-input__field::placeholder {
  color: var(--color-text-muted);
}

.ui-input__field:disabled {
  cursor: not-allowed;
}

.ui-input__actions {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.ui-input__clear {
  flex-shrink: 0;
}

/* Remove number input arrows */
.ui-input__field[type='number']::-webkit-inner-spin-button,
.ui-input__field[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
}
.ui-input__field[type='number'] {
  -moz-appearance: textfield;
}

.ui-input__error {
  font-size: 0.8rem;
  color: var(--color-danger);
}
</style>
