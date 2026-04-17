<script setup lang="ts">
import errorIconMarkup from '../../assets/images/icons/error.svg?raw'

withDefaults(defineProps<{
  state: 'loading' | 'error' | 'empty'
  title?: string
  message?: string
  loadingLabel?: string
  emptyIcon?: string
  fill?: boolean
  minHeight?: string
  compact?: boolean
}>(), {
  title: '',
  message: '',
  loadingLabel: 'Chargement...',
  emptyIcon: '🔍',
  fill: false,
  minHeight: '',
  compact: false
})
</script>

<template>
  <div
    class="ui-status-state"
    :class="{
      'ui-status-state--fill': fill,
      'ui-status-state--compact': compact,
      'ui-status-state--error': state === 'error',
      'ui-status-state--empty': state === 'empty'
    }"
    :style="{ minHeight: minHeight || undefined }"
  >
    <UiLoadingSpinner
      v-if="state === 'loading'"
      :size="compact ? 'sm' : 'lg'"
      class="ui-status-state__loading"
    >
      {{ loadingLabel }}
    </UiLoadingSpinner>

    <div v-else class="ui-status-state__content" :role="state === 'error' ? 'alert' : undefined">
      <span
        v-if="state === 'error'"
        class="ui-status-state__icon ui-status-state__icon--svg"
        aria-hidden="true"
        v-html="errorIconMarkup"
      ></span>
      <span v-else class="ui-status-state__icon" aria-hidden="true">{{ emptyIcon }}</span>

      <div class="ui-status-state__text">
        <h3 v-if="title" class="ui-status-state__title">{{ title }}</h3>
        <p v-if="message" class="ui-status-state__message">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-status-state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 4rem 2rem;
  text-align: center;
}

.ui-status-state--fill {
  flex: 1;
  min-height: 100%;
}

.ui-status-state__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  color: var(--color-text-light);
}

.ui-status-state--error .ui-status-state__content {
  color: var(--color-danger);
}

.ui-status-state__icon {
  display: block;
  margin-bottom: 1rem;
  font-size: 3rem;
  line-height: 1;
}

.ui-status-state__icon--svg {
  width: 3rem;
  height: 3rem;
}

.ui-status-state__icon--svg :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
  fill: currentColor;
}

.ui-status-state__icon--svg :deep(path) {
  fill: currentColor;
}

.ui-status-state__title {
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.ui-status-state--error .ui-status-state__title {
  color: var(--color-danger);
}

.ui-status-state__message {
  color: inherit;
}

.ui-status-state__loading {
  width: 100%;
}

.ui-status-state--compact {
  padding: 0.75rem 0.85rem;
  text-align: left;
}

.ui-status-state--compact .ui-status-state__content {
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.7rem;
}

.ui-status-state--compact :deep(.ui-status-state__loading) {
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 0.6rem;
  padding: 0;
  width: 100%;
}

.ui-status-state--compact :deep(.ui-status-state__loading .spinner-text) {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.3;
  color: var(--color-text-light);
}

.ui-status-state--compact .ui-status-state__icon {
  margin-bottom: 0;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.ui-status-state--compact .ui-status-state__icon--svg {
  width: 1.1rem;
  height: 1.1rem;
}

.ui-status-state__text {
  min-width: 0;
}

.ui-status-state--compact .ui-status-state__title {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.3;
}

.ui-status-state--compact .ui-status-state__message {
  margin: 0.18rem 0 0;
  font-size: 0.76rem;
  line-height: 1.3;
}
</style>