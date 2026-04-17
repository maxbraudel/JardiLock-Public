<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  rows: { type: Number, default: 5 },
  resize: { type: String, default: 'vertical' },
  maxLength: { type: Number, default: undefined }
})

const emit = defineEmits(['update:modelValue'])

const inputId = computed(() =>
  `textarea-${(props.label || props.placeholder || Math.random().toString(36).slice(2)).toLowerCase().replace(/\s+/g, '-')}`
)
</script>

<template>
  <div class="ui-textarea" :class="{ 'ui-textarea--error': error, 'ui-textarea--disabled': disabled }">
    <label v-if="label" :for="inputId" class="ui-textarea__label">
      {{ label }}
      <span v-if="required" class="ui-textarea__required">*</span>
    </label>

    <UiInputFrame class="ui-textarea__frame" :error="Boolean(error)" :disabled="disabled">
      <textarea
        :id="inputId"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :rows="rows"
        :maxlength="maxLength"
        class="ui-textarea__field"
        :style="{ resize }"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </UiInputFrame>

    <span v-if="error" class="ui-textarea__error">{{ error }}</span>
  </div>
</template>

<style scoped>
.ui-textarea {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.ui-textarea__label {
  font-size: 0.875rem;
  font-weight: var(--font-weight-semi-bold);
  color: var(--color-text);
}

.ui-textarea__required {
  color: var(--color-danger);
}

.ui-textarea__frame {
  align-items: stretch;
  min-height: 7.5rem;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  border-radius: var(--radius-lg);
}

.ui-textarea__frame :deep(.ui-input-frame__control) {
  align-items: stretch;
}

.ui-textarea__field {
  width: 100%;
  min-height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: 0.9rem;
  line-height: 1.5;
  padding: 0;
}

.ui-textarea__field::placeholder {
  color: var(--color-text-muted);
}

.ui-textarea__field:disabled {
  cursor: not-allowed;
}

.ui-textarea__error {
  font-size: 0.8rem;
  color: var(--color-danger);
}
</style>