<script setup lang="ts">
const props = defineProps({
  label: { type: String, default: '' },
  icon: { type: String, default: '' },
  tone: { type: String, default: 'plain' }
})
</script>

<template>
  <span class="ui-tag" :class="[`tone-${props.tone}`]">
    <svg v-if="props.icon === 'check'" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
    </svg>
    <slot>{{ label }}</slot>
  </span>
</template>

<style scoped>
.ui-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-width: min(180px, 100%);
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.ui-tag.tone-plain {
  color: var(--color-text);
  font-size: 0.9rem;
}

.ui-tag.tone-plain svg {
  color: var(--color-primary);
  flex-shrink: 0;
}

.ui-tag.tone-chip {
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  background: var(--color-accent-light);
  color: var(--color-primary-dark);
  font-size: 0.82rem;
  font-weight: var(--font-weight-semi-bold);
}
</style>