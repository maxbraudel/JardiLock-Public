<script setup lang="ts">
import { getApiBase } from '~/services/api/runtime'

useHead(() => {
  const apiOrigin = getApiBase().replace(/\/api$/, '')

  return {
    link: [
      { rel: 'dns-prefetch', href: apiOrigin },
      { rel: 'preconnect', href: apiOrigin, crossorigin: '' }
    ]
  }
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
/* Global styles are in assets/css/main.css */
</style>
