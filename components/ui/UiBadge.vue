<script setup lang="ts">
const props = defineProps({
  tone: { type: String, default: 'surface' },
  size: { type: String, default: 'md' }
})
</script>

<template>
  <span class="ui-badge" :class="[`tone-${props.tone}`, `size-${props.size}`]">
    <slot />
  </span>
</template>

<style scoped>
.ui-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.ui-badge.size-sm {
  font-size: 0.7rem;
}

.ui-badge.size-md {
  font-size: 0.78rem;
}

.ui-badge.tone-primary {
  background: var(--color-primary);
  color: white;
}

.ui-badge.tone-surface {
  background: var(--color-bg-alt);
  border-color: rgba(0, 0, 0, 0.06);
  color: var(--color-text-muted);
}

.ui-badge.tone-muted {
  background: var(--color-accent-light);
  color: var(--color-primary-dark);
}

.ui-badge.tone-inverse {
  background: rgba(0, 0, 0, 0.72);
  color: white;
}
</style>