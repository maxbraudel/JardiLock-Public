<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  authenticated: { type: Boolean, default: false },
  displayName: { type: String, default: 'Profil' },
  profileImage: { type: String, default: '' },
  userInitial: { type: String, default: '?' },
  open: { type: Boolean, default: false },
  label: { type: String, default: '' }
})

const resolvedShape = computed(() => (props.authenticated ? 'pill' : 'round'))
</script>

<template>
  <UiButtonCore
    class="ui-user-menu-button"
    :class="{
      'is-auth': props.authenticated,
      'is-guest': !props.authenticated,
      'is-open': props.open
    }"
    variant="surface-light"
    size="md"
    :shape="resolvedShape"
    :label="props.label"
    type="button"
  >
    <template #leading>
      <span v-if="props.authenticated" class="ui-user-menu-button__avatar" aria-hidden="true">
        <img v-if="props.profileImage" :src="props.profileImage" alt="" class="ui-user-menu-button__avatar-image">
        <span v-else class="ui-user-menu-button__avatar-fallback">{{ props.userInitial }}</span>
      </span>

      <svg v-else class="ui-user-menu-button__guest-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" fill="currentColor"/>
      </svg>
    </template>

    <span v-if="props.authenticated" class="ui-user-menu-button__name">{{ props.displayName }}</span>
  </UiButtonCore>
</template>

<style scoped>
.ui-user-menu-button {
  --ui-button-gap: 0.5rem;
}

.ui-user-menu-button.is-open {
  background: var(--btn-surface-hover-bg);
  border-color: var(--btn-surface-hover-border);
  color: var(--color-text);
}

.ui-user-menu-button.is-guest {
  padding: 0;
  --ui-button-gap: 0;
}

.ui-user-menu-button.is-auth {
  --ui-button-height: var(--btn-height);
  --ui-button-gap: 0.55rem;
  padding-inline-start: 0.2rem;
  padding-inline-end: var(--btn-padding-inline-pill);
}

.ui-user-menu-button.is-auth :deep(.ui-button-core__content) {
  min-width: 0;
}

.ui-user-menu-button.is-auth :deep(.ui-button-core__icon),
.ui-user-menu-button.is-guest :deep(.ui-button-core__icon) {
  line-height: 0;
}

.ui-user-menu-button__guest-icon {
  display: block;
}

.ui-user-menu-button__name {
  display: inline-block;
  font-size: 0.82rem;
  font-weight: var(--font-weight-semi-bold);
  line-height: 1;
  max-width: 9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-user-menu-button__avatar {
  --user-toggle-avatar-size: 28px;
  width: var(--user-toggle-avatar-size);
  height: var(--user-toggle-avatar-size);
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--color-primary);
}

.ui-user-menu-button__avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ui-user-menu-button__avatar-fallback {
  display: block;
  color: white;
  font-size: calc(var(--user-toggle-avatar-size) * 0.43);
  font-weight: var(--font-weight-bold);
  line-height: 1;
}

@media (max-width: 768px) {
  .ui-user-menu-button.is-auth {
    --ui-button-height: var(--btn-height-touch);
  }
}
</style>