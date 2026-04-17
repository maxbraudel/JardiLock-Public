<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  size: { type: String, default: 'md' }
})
</script>

<template>
  <div class="loading-spinner" :class="`spinner-${size}`">
    <div class="spinner-ring"></div>
    <p class="spinner-text"><slot>Chargement...</slot></p>
  </div>
</template>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
}

.spinner-ring {
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite !important;
}

.spinner-sm .spinner-ring { width: 24px; height: 24px; }
.spinner-md .spinner-ring { width: 40px; height: 40px; }
.spinner-lg .spinner-ring { width: 56px; height: 56px; }

.spinner-text {
  color: var(--color-text-light);
  font-size: 0.9rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
