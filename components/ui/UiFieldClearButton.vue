<script setup lang="ts">
defineProps({
  label: { type: String, default: 'Effacer' },
  disabled: { type: Boolean, default: false }
})
</script>

<template>
  <UiButtonCore
    class="ui-field-clear-button"
    variant="ghost"
    size="field"
    shape="round"
    :label="label"
    :disabled="disabled"
    type="button"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
    </svg>
  </UiButtonCore>
</template>

<style scoped>
.ui-field-clear-button {
  --ui-button-fg: var(--color-text-muted);
  font-size: 1rem;
}
</style>