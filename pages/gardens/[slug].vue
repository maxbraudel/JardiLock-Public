<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

await navigateTo({
  path: '/gardens',
  hash: `#listing=${encodeURIComponent(slug)}`
}, { replace: true })
</script>

<template>
  <div></div>
</template>