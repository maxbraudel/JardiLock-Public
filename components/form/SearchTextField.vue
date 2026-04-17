<script setup lang="ts">
defineProps({
  modelValue: { type: String, default: '' },
  inputId: { type: String, default: undefined },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
  inputMode: { type: String, default: undefined },
  active: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  clearLabel: { type: String, default: 'Effacer' },
  role: { type: String, default: undefined },
  ariaAutocomplete: { type: String, default: undefined },
  ariaExpanded: { type: String, default: undefined },
  ariaControls: { type: String, default: undefined },
  ariaActivedescendant: { type: String, default: undefined }
})

const emit = defineEmits(['update:modelValue', 'focus', 'keydown', 'clear'])

function handleInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function handleClear() {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<template>
  <UiInputFrame class="search-text-field" :active="active" :disabled="disabled">
    <template #leading>
      <slot name="leading">
        <svg class="search-text-field__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15.5 14h-.79l-.28-.27a6 6 0 10-.71.71l.27.28v.79L20 21.5 21.5 20l-6-6zm-5.5 0A4 4 0 1110 6a4 4 0 010 8z" fill="currentColor"/>
        </svg>
      </slot>
    </template>

    <input
      :id="inputId"
      type="text"
      class="search-text-field__input"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :inputmode="inputMode"
      :disabled="disabled"
      :role="role"
      :aria-autocomplete="ariaAutocomplete"
      :aria-expanded="ariaExpanded"
      :aria-controls="ariaControls"
      :aria-activedescendant="ariaActivedescendant"
      @input="handleInput"
      @focus="$emit('focus', $event)"
      @keydown="$emit('keydown', $event)"
    />

    <template v-if="(clearable && modelValue) || $slots.trailing" #trailing>
      <div class="search-text-field__actions">
        <UiFieldClearButton
          v-if="clearable && modelValue"
          class="search-text-field__clear"
          :label="clearLabel"
          :disabled="disabled"
          @click="handleClear"
        />
        <slot name="trailing" />
      </div>
    </template>
  </UiInputFrame>
</template>

<style scoped>
.search-text-field {
  width: 100%;
}

.search-text-field__input {
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: 0.95rem;
  padding: 0;
}

.search-text-field__input::placeholder {
  color: var(--color-text-muted);
}

.search-text-field__icon {
  display: block;
  pointer-events: none;
}

.search-text-field__actions {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.search-text-field__clear {
  flex-shrink: 0;
}
</style>