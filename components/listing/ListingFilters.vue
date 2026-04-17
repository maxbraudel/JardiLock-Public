<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogFilterOptions, CatalogFiltersState } from '~/types/domain'

const DAY_LABELS = [
  { value: 0, label: 'Lun' },
  { value: 1, label: 'Mar' },
  { value: 2, label: 'Mer' },
  { value: 3, label: 'Jeu' },
  { value: 4, label: 'Ven' },
  { value: 5, label: 'Sam' },
  { value: 6, label: 'Dim' }
]

const props = withDefaults(defineProps<{
  showHeading?: boolean
  modelValue: CatalogFiltersState
  options: CatalogFilterOptions
}>(), {
  showHeading: true
})

const emit = defineEmits<{
  'update:modelValue': [CatalogFiltersState]
}>()

function updateFilters(patch: Partial<CatalogFiltersState>) {
  emit('update:modelValue', {
    ...props.modelValue,
    ...patch
  })
}

// computed — count active filters
const activeFilterCount = computed(() => {
  let count = 0
  if (props.modelValue.minArea > 0) count++
  if (props.modelValue.maxPrice < Infinity && props.modelValue.maxPrice > 0) count++
  if (props.modelValue.selectedEquipment.length > 0) count++
  if (props.modelValue.selectedEvents.length > 0) count++
  if (props.modelValue.animalsOnly) count++
  if (props.modelValue.selectedDays.length > 0) count++
  if (props.modelValue.timeFrom) count++
  if (props.modelValue.timeTo) count++
  if (props.modelValue.publicHolidaysOnly) count++
  return count
})

function toggleEquipment(tag: string) {
  const current = [...props.modelValue.selectedEquipment]
  const index = current.indexOf(tag)
  if (index === -1) {
    current.push(tag)
  } else {
    current.splice(index, 1)
  }
  updateFilters({ selectedEquipment: current })
}

function toggleEvent(tag: string) {
  const current = [...props.modelValue.selectedEvents]
  const index = current.indexOf(tag)
  if (index === -1) {
    current.push(tag)
  } else {
    current.splice(index, 1)
  }
  updateFilters({ selectedEvents: current })
}

function toggleDay(day: number) {
  const current = [...props.modelValue.selectedDays]
  const index = current.indexOf(day)
  if (index === -1) {
    current.push(day)
  } else {
    current.splice(index, 1)
  }
  updateFilters({ selectedDays: current })
}

</script>

<template>
  <div class="listing-filters">
    <div v-if="props.showHeading" class="filters-header">
      <h3 v-if="props.showHeading">
        Filtres
        <UiBadge v-if="activeFilterCount" tone="primary" size="sm">{{ activeFilterCount }}</UiBadge>
      </h3>
    </div>

    <!-- Min area -->
    <div class="filter-group">
      <UiInput
        label="Superficie min. (m²)"
        type="number"
        :model-value="modelValue.minArea || ''"
        placeholder="0"
        min="0"
        @update:model-value="updateFilters({ minArea: Number($event) || 0 })"
      />
    </div>

    <!-- Max price -->
    <div class="filter-group">
      <UiInput
        label="Prix max. (€)"
        type="number"
        :model-value="modelValue.maxPrice < Infinity ? modelValue.maxPrice / 100 : ''"
        placeholder="Illimité"
        min="0"
        @update:model-value="updateFilters({ maxPrice: $event ? Number($event) * 100 : Infinity })"
      />
    </div>

    <!-- Animals -->
    <div class="filter-group filter-checkbox">
      <UiCheckbox
        :model-value="modelValue.animalsOnly"
        @update:model-value="updateFilters({ animalsOnly: $event })"
      >
        Animaux acceptés uniquement
      </UiCheckbox>
    </div>

    <!-- Available days of week -->
    <div class="filter-group">
      <label class="filter-label">Jours disponibles</label>
      <div class="day-list">
        <UiChipButton
          v-for="day in DAY_LABELS"
          :key="day.value"
          class="day-btn"
          :selected="modelValue.selectedDays.includes(day.value)"
          shape="soft"
          @click="toggleDay(day.value)"
        >
          {{ day.label }}
        </UiChipButton>
      </div>
    </div>

    <!-- Time range -->
    <div class="filter-group">
      <label class="filter-label">Plage horaire</label>
      <div class="time-range">
        <FormWheelTimePicker
          label="De"
          :model-value="modelValue.timeFrom"
          placeholder="Début"
          @update:model-value="updateFilters({ timeFrom: $event })"
        />
        <span class="time-separator">–</span>
        <FormWheelTimePicker
          label="À"
          :model-value="modelValue.timeTo"
          placeholder="Fin"
          @update:model-value="updateFilters({ timeTo: $event })"
        />
      </div>
    </div>

    <!-- Public holidays -->
    <div class="filter-group filter-checkbox">
      <UiCheckbox
        :model-value="modelValue.publicHolidaysOnly"
        @update:model-value="updateFilters({ publicHolidaysOnly: $event })"
      >
        Disponible les jours fériés
      </UiCheckbox>
    </div>

    <!-- Equipment tags -->
    <div v-if="options.availableEquipment.length > 0" class="filter-group">
      <label class="filter-label">Équipements</label>
      <div class="tag-list">
        <UiChipButton
          v-for="tag in options.availableEquipment"
          :key="tag"
          class="tag-btn"
          :selected="modelValue.selectedEquipment.includes(tag)"
          @click="toggleEquipment(tag)"
        >
          {{ tag }}
        </UiChipButton>
      </div>
    </div>

    <!-- Event tags -->
    <div v-if="options.availableEvents.length > 0" class="filter-group">
      <label class="filter-label">Types d'événements</label>
      <div class="tag-list">
        <UiChipButton
          v-for="tag in options.availableEvents"
          :key="tag"
          class="tag-btn"
          :selected="modelValue.selectedEvents.includes(tag)"
          @click="toggleEvent(tag)"
        >
          {{ tag }}
        </UiChipButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.listing-filters {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0;
}

.filters-header {
  display: flex;
  align-items: center;
}

.filters-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.tag-btn {
  justify-content: center;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: var(--font-weight-semi-bold, 600);
  color: var(--color-text);
}

.day-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.day-btn {
  min-width: 2.5rem;
  text-align: center;
}

.time-range {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
}

.time-separator {
  color: var(--color-text-light);
  font-size: 0.9rem;
  padding-bottom: 0.5rem;
}
</style>
