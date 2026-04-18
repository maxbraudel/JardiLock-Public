<script setup lang="ts">
import { ref } from 'vue'
import { useFocusTrap } from '~/composables/useFocusTrap'
import { useModalCloseInteractions } from '~/composables/useModalCloseInteractions'

const props = defineProps({
  title: { type: String, default: '' },
  panelClass: { type: String, default: '' },
  compact: { type: Boolean, default: false },
  hideHeader: { type: Boolean, default: false },
  headerCloseVariant: { type: String, default: 'surface-light' },
  headerCloseLabel: { type: String, default: 'Fermer' },
  headerCloseSize: { type: String, default: 'md' },
  headerCloseShowLabel: { type: Boolean, default: false },
  headerCloseResponsiveIconOnly: { type: Boolean, default: false },
  floatingClose: { type: Boolean, default: false },
  floatingCloseVariant: { type: String, default: 'surface-light' },
  floatingCloseLabel: { type: String, default: '' },
  floatingCloseResponsiveIconOnly: { type: Boolean, default: false },
  scrollOnPanel: { type: Boolean, default: false },
  useScrollContainer: { type: Boolean, default: true },
  scrollTopInsetScrollbar: { type: [String, Number], default: 0 },
  scrollBottomInsetScrollbar: { type: [String, Number], default: 0 },
  scrollTopInsetContent: { type: [String, Number], default: 0 },
  scrollBottomInsetContent: { type: [String, Number], default: 0 },
  fullBleed: { type: Boolean, default: false },
  coverViewport: { type: Boolean, default: false },
  transparentBackdrop: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const panelRef = ref<HTMLElement | null>(null)

type ScrollContainerApi = {
  scrollTo: (options: ScrollToOptions | number) => void
  getScrollTop: () => number
}

const scrollContainerRef = ref<ScrollContainerApi | null>(null)

function scrollTo(options: ScrollToOptions | number) {
  scrollContainerRef.value?.scrollTo(options)
}

function getScrollTop() {
  return scrollContainerRef.value?.getScrollTop() || 0
}

function scrollToTop() {
  scrollContainerRef.value?.scrollTo({ top: 0, behavior: 'auto' })
}

const {
  closeSwipeActive,
  handleTouchEnd,
  handleTouchMove,
  handleTouchStart,
  resetSwipeGesture
} = useModalCloseInteractions({
  panelRef,
  getScrollTop,
  onClose: () => emit('close')
})

useFocusTrap({
  containerRef: panelRef
})

defineExpose({
  scrollTo,
  getScrollTop,
  scrollToTop
})
</script>

<template>
  <Teleport to="body">
    <div class="modal-shell" :class="{ 'cover-viewport-shell': coverViewport }">
      <div class="modal-backdrop" :class="{ transparent: transparentBackdrop }" @click="$emit('close')"></div>

      <UiCloseButton
        v-if="floatingClose"
        :variant="floatingCloseVariant"
        :label="floatingCloseLabel || 'Fermer'"
        :show-label="Boolean(floatingCloseLabel)"
        :responsive-icon-only="floatingCloseResponsiveIconOnly"
        class="modal-close-button modal-close-floating"
        :class="{ 'is-swipe-active': closeSwipeActive }"
        @click="$emit('close')"
      />

      <div
        ref="panelRef"
        class="modal-panel"
        :class="[
          panelClass,
          {
            compact,
            'full-bleed-panel': fullBleed,
            'is-close-swipe-active': closeSwipeActive,
            'scroll-on-panel': scrollOnPanel,
            'without-header': hideHeader,
            'with-floating-close': floatingClose
          }
        ]"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        @touchcancel="resetSwipeGesture"
      >
        <div v-if="$slots['floating-actions']" class="modal-floating-toolbar">
          <div v-if="$slots['floating-actions']" class="modal-floating-actions">
            <slot name="floating-actions" />
          </div>
        </div>

        <div v-if="!hideHeader" class="modal-header">
          <h2 v-if="title" class="modal-title">{{ title }}</h2>
          <div class="modal-header-actions">
            <slot name="header-actions" />

            <UiCloseButton
              class="modal-close-button modal-header-close"
              :class="{ 'is-swipe-active': closeSwipeActive }"
              :variant="headerCloseVariant"
              :label="headerCloseLabel"
              :size="headerCloseSize"
              :show-label="headerCloseShowLabel"
              :responsive-icon-only="headerCloseResponsiveIconOnly"
              @click="$emit('close')"
            />
          </div>
        </div>
        <div v-if="!hideHeader" class="divider" aria-hidden="true" />

        <div class="modal-body" :class="{ 'content-on-panel': scrollOnPanel }">
          <UiScrollContainer
            v-if="useScrollContainer"
            ref="scrollContainerRef"
            class="modal-body-scroll"
            :top-inset-scrollbar="props.scrollTopInsetScrollbar"
            :bottom-inset-scrollbar="props.scrollBottomInsetScrollbar"
            :top-inset-content="props.scrollTopInsetContent"
            :bottom-inset-content="props.scrollBottomInsetContent"
          >
            <slot />
          </UiScrollContainer>

          <div v-else class="modal-body-content">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-shell {
  position: fixed;
  inset: var(--header-height) 0 0 0;
  z-index: var(--z-overlay-shell);
}

.modal-shell.cover-viewport-shell {
  inset: 0;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
}

.modal-backdrop.transparent {
  background: transparent;
  backdrop-filter: none;
}

.modal-panel {
  position: absolute;
  top: calc(var(--floating-offset) + var(--space-2));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100vw - (var(--page-gutter) * 2));
  max-height: calc(100vh - var(--header-height) - 3rem);
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  border-radius: var(--floating-panel-radius);
  box-shadow: var(--floating-panel-shadow);
  overflow: hidden;
}

.modal-panel.full-bleed-panel {
  top: 0;
  left: 0;
  transform: none;
  width: 100%;
  height: 100%;
  min-height: 100%;
  max-height: none;
  border-radius: 0;
  box-shadow: none;
}

.modal-shell.cover-viewport-shell .modal-panel.full-bleed-panel {
  height: 100dvh;
  min-height: 100dvh;
  max-height: 100dvh;
}

.modal-panel.scroll-on-panel {
  overflow: hidden;
}

.modal-panel.compact {
  width: min(480px, calc(100vw - (var(--page-gutter) * 2)));
}

.modal-panel.without-header {
  padding-top: 0;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 1rem;
  padding-inline-start: var(--page-gutter-safe-inline-start);
  padding-inline-end: var(--page-gutter-safe-inline-end);
}

.divider {
  height: var(--divider-weight);
  background: var(--divider-color);
}

.modal-title {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 1.1rem;
  margin: 0;
}

.modal-header-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--floating-toolbar-gap);
  flex-shrink: 0;
}

.modal-close-floating {
  position: absolute;
  top: var(--floating-offset);
  right: var(--page-gutter-safe-inline-end);
  z-index: var(--z-surface-floating);
}

.modal-close-button.variant-surface-light.is-swipe-active {
  background: var(--btn-surface-hover-bg);
  border-color: var(--btn-surface-hover-border);
  color: var(--color-text);
  box-shadow: var(--shadow-md);
}

.modal-close-button.variant-surface-dark.is-swipe-active {
  background: var(--btn-surface-dark-bg-hover);
  border-color: var(--btn-surface-dark-border);
  color: white;
  box-shadow: var(--shadow-md);
}

.modal-close-button.variant-primary.is-swipe-active {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
  color: white;
  box-shadow: var(--shadow-md);
}

.modal-panel.is-close-swipe-active :deep(.modal-close-button.variant-surface-light:not(:disabled)) {
  background: var(--btn-surface-hover-bg);
  border-color: var(--btn-surface-hover-border);
  color: var(--color-text);
  box-shadow: var(--shadow-md);
}

.modal-panel.is-close-swipe-active :deep(.modal-close-button.variant-surface-dark:not(:disabled)) {
  background: var(--btn-surface-dark-bg-hover);
  border-color: var(--btn-surface-dark-border);
  color: white;
  box-shadow: var(--shadow-md);
}

.modal-panel.is-close-swipe-active :deep(.modal-close-button.variant-primary:not(:disabled)) {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
  color: white;
  box-shadow: var(--shadow-md);
}

.modal-floating-toolbar {
  position: absolute;
  top: var(--floating-offset);
  left: var(--page-gutter-safe-inline-start);
  right: auto;
  z-index: var(--z-surface-stacked);
  display: flex;
  align-items: center;
  gap: var(--floating-toolbar-gap);
}

.modal-floating-actions {
  display: flex;
  align-items: center;
  gap: var(--floating-toolbar-gap);
}

.modal-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.modal-body.content-on-panel {
  overflow: hidden;
}

.modal-body-scroll {
  height: 100%;
}

.modal-body-content {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}

@media (max-width: 768px) {
  .modal-panel,
  .modal-panel.compact {
    top: 0;
    width: 100%;
    max-height: 100%;
    height: 100%;
    border-radius: 0;
  }

  .modal-floating-toolbar {
    top: var(--floating-offset-compact);
    left: var(--page-gutter-safe-inline-start);
    right: auto;
    gap: var(--floating-toolbar-gap);
  }

  .modal-close-floating {
    top: var(--floating-offset-compact);
    right: var(--page-gutter-safe-inline-end);
  }
}
</style>