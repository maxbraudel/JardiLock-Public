<script setup lang="ts">
import { useOverlayRoute } from '~/composables/useOverlayRoute'

const { isListingOpen, isAuthOpen, authMode, listingSlug } = useOverlayRoute()
</script>

<template>
  <ListingOverlay
    v-if="isListingOpen && listingSlug"
    :slug="listingSlug"
  />

  <AuthOverlay
    v-if="isAuthOpen && authMode"
    :mode="authMode"
  />
</template>