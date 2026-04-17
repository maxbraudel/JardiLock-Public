<script setup lang="ts">
import type { ListingSortField, ListingSortOrder } from '~/types/domain'

type SortOptionField = Exclude<ListingSortField, 'UTC_created_at'>

const props = defineProps<{
  currentSort: ListingSortField
  currentOrder: ListingSortOrder
}>()

const emit = defineEmits<{
  sortChange: [field: ListingSortField, order: ListingSortOrder]
}>()

const sortOptions = [
  { field: 'price_cents', label: 'Prix' },
  { field: 'area_m2', label: 'Superficie' },
  { field: 'capacity', label: 'Capacité' }
] as const satisfies ReadonlyArray<{ field: SortOptionField; label: string }>

function handleSort(field: SortOptionField) {
  if (props.currentSort === field) {
    // Toggle order
    const newOrder: ListingSortOrder = props.currentOrder === 'asc' ? 'desc' : 'asc'
    emit('sortChange', field, newOrder)
  } else {
    emit('sortChange', field, 'asc')
  }
}

function getSortIcon(field: SortOptionField) {
  if (props.currentSort !== field) return '↕'
  return props.currentOrder === 'asc' ? '↑' : '↓'
}
</script>

<template>
  <div class="sort-bar">
    <UiPillButton
      v-for="option in sortOptions"
      :key="option.field"
      :variant="currentSort === option.field ? 'primary' : 'default'"
      @click="handleSort(option.field)"
    >
      {{ option.label }}
      <template #trailing>
        <span class="sort-icon">{{ getSortIcon(option.field) }}</span>
      </template>
    </UiPillButton>
  </div>
</template>

<style scoped>
.sort-bar {
  display: flex;
  align-items: center;
  gap: var(--catalog-control-gap);
  flex-wrap: wrap;
}

@media (max-width: 1024px) {
  .sort-bar {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .sort-bar {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--floating-toolbar-gap);
    width: 100%;
  }

  .sort-bar :deep(.pill-btn) {
    width: 100%;
    justify-content: center;
  }
}

.sort-icon {
  font-size: 0.8rem;
  opacity: 0.7;
}
</style>
