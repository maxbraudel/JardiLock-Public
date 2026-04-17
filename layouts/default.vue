<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const showFooter = computed(() => route.path !== '/gardens')
const isCatalogRoute = computed(() => route.path === '/gardens')
</script>

<template>
  <div class="app-layout" :class="{ 'app-layout--catalog': isCatalogRoute }">
    <LayoutAppHeader />
    <main class="main-content">
      <slot />
    </main>
    <LayoutAppFooter v-if="showFooter" />
    <LayoutAppOverlayHost />
    <UiToastHost />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100svh;
}

.main-content {
  flex: 1;
  min-height: 0;
  margin-top: var(--header-height);
}

.app-layout--catalog {
  height: 100svh;
  overflow: hidden;
}

@supports (height: 100dvh) {
  .app-layout--catalog {
    height: 100dvh;
  }
}
</style>
