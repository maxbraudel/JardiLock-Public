<script setup lang="ts">
import { useToast } from '~/composables/useToast'

const { dismissToast, toasts } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="ui-toast-host" aria-live="polite" aria-atomic="true">
      <TransitionGroup name="ui-toast-list" tag="div" class="ui-toast-stack">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="ui-toast"
          :class="`tone-${toast.tone}`"
          role="status"
        >
          <p class="ui-toast__message">{{ toast.message }}</p>

          <button
            type="button"
            class="ui-toast__close"
            aria-label="Fermer la notification"
            @click="dismissToast(toast.id)"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.ui-toast-host {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + var(--space-4));
  right: var(--page-gutter-safe-inline-end);
  z-index: 2500;
  pointer-events: none;
}

.ui-toast-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
}

.ui-toast {
  pointer-events: auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--space-3);
  width: min(24rem, calc(100vw - (var(--page-gutter-safe-inline-start) + var(--page-gutter-safe-inline-end))));
  padding: 0.875rem 0.95rem;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(27, 27, 27, 0.96);
  color: white;
  box-shadow: var(--shadow-lg);
}

.ui-toast.tone-success {
  background: rgba(20, 83, 45, 0.96);
}

.ui-toast.tone-error {
  background: rgba(153, 27, 27, 0.96);
}

.ui-toast__message {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
}

.ui-toast__close {
  border: 0;
  background: transparent;
  color: inherit;
  width: 1.5rem;
  height: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  cursor: pointer;
  opacity: 0.8;
}

.ui-toast__close:hover,
.ui-toast__close:focus-visible {
  opacity: 1;
  background: rgba(255, 255, 255, 0.12);
  outline: none;
}

.ui-toast-list-enter-active,
.ui-toast-list-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.ui-toast-list-enter-from,
.ui-toast-list-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>