<script setup lang="ts">
const props = defineProps({
  truncate: { type: Boolean, default: false }
})
</script>

<template>
  <div class="ui-floating-text-label" :class="{ 'is-truncate': props.truncate }">
    <slot />
  </div>
</template>

<style scoped>
.ui-floating-text-label {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: var(--btn-height);
  padding-block: 0.45rem;
  padding-inline: 0.9rem;
  border-radius: 20px;
  background: rgba(10, 12, 18, 0.72);
  color: white;
  backdrop-filter: blur(10px);
  font: inherit;
  font-size: 0.875rem;
  font-weight: var(--font-weight-semi-bold);
  line-height: 1.2;
}

.ui-floating-text-label.is-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
