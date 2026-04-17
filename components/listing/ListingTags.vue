<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'

const props = defineProps({
  tags: { type: Object as PropType<Record<string, string[] | undefined>>, required: true },
  showTitle: { type: Boolean, default: true }
})

const categoryLabels: Record<string, string> = {
  equipment: 'Équipements',
  game: 'Jeux',
  event: 'Événements',
  ambiance: 'Ambiance',
  parking: 'Stationnement'
}

// computed — filter out empty categories
const visibleCategories = computed(() => {
  return Object.entries(props.tags)
    .filter(([_, items]) => items && items.length > 0)
    .map(([category, items]) => ({
      category,
      label: categoryLabels[category] || category,
      items
    }))
})
</script>

<template>
  <div v-if="visibleCategories.length > 0" class="listing-tags">
    <h3 v-if="showTitle">Caractéristiques</h3>
    <div
      v-for="cat in visibleCategories"
      :key="cat.category"
      class="tag-category"
    >
      <h4>{{ cat.label }}</h4>
      <div class="tag-list">
        <UiTag
          v-for="item in cat.items"
          :key="item"
          class="tag-item"
          icon="check"
        >
          {{ item }}
        </UiTag>
      </div>
    </div>
  </div>
</template>

<style scoped>
.listing-tags {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.listing-tags h3 {
  font-size: 1.15rem;
}

.tag-category {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.tag-category h4 {
  font-size: 0.9rem;
  color: var(--color-text-light);
  font-weight: var(--font-weight-semi-bold);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
}
</style>
