<script setup lang="ts">
import { ref, toRef, type PropType } from 'vue'
import { VueDatePicker, type PickerSection } from '@vuepic/vue-datepicker'
import { fr } from 'date-fns/locale'
import { useFloatingDateMenu } from '~/composables/useFloatingDateMenu'
import { useLocationAutocomplete } from '~/composables/useLocationAutocomplete'
import type { LocationSuggestion, LocationSuggestionType } from '~/types/domain'

const DATEPICKER_HIDE_NAVIGATION: PickerSection[] = ['time', 'hours', 'minutes', 'seconds']
const DATEPICKER_TIME_CONFIG = {
  enableTimePicker: false,
  enableMinutes: false,
  enableSeconds: false,
  noHoursOverlay: true,
  noMinutesOverlay: true,
  noSecondsOverlay: true
} as const

const locationTypeLabels: Record<LocationSuggestionType, string> = {
  address: 'Adresse',
  street: 'Rue',
  city: 'Ville',
  department: 'Département',
  region: 'Région'
}

const props = defineProps({
  locationQuery: { type: String, default: '' },
  selectedLocation: { type: Object as PropType<LocationSuggestion | null>, default: null },
  selectedDate: { type: String, default: '' }
})

const emit = defineEmits(['update:locationQuery', 'update:selectedLocation', 'update:selectedDate'])

const rootRef = ref<HTMLElement | null>(null)
const datePanelRef = ref<HTMLElement | null>(null)

const locationListId = 'catalog-location-suggestions'
const dateMenuId = 'catalog-date-menu'

const {
  activeLocationDescendant,
  activeLocationIndex,
  clearLocation,
  closeLocationDropdown,
  handleLocationFocus,
  handleLocationInput,
  handleLocationKeydown,
  hasLocationDropdown,
  hasLocationSuggestionsError,
  isLoadingLocations,
  localLocationQuery,
  localSelectedLocation,
  locationSuggestions,
  selectLocationSuggestion
} = useLocationAutocomplete({
  rootRef,
  locationQuery: toRef(props, 'locationQuery'),
  selectedLocation: toRef(props, 'selectedLocation'),
  emitLocationQuery: (value) => emit('update:locationQuery', value),
  emitSelectedLocation: (value) => emit('update:selectedLocation', value),
  optionIdPrefix: 'catalog-location-option'
})

const {
  clearDate,
  handleDateChange,
  handleDateMenuClosed,
  handleDateMenuOpen,
  localDate
} = useFloatingDateMenu({
  datePanelRef,
  selectedDate: toRef(props, 'selectedDate'),
  emitSelectedDate: (value) => emit('update:selectedDate', value),
  dateMenuId
})

function handleDateOpen() {
  closeLocationDropdown()
  handleDateMenuOpen()
}
</script>

<template>
  <div ref="rootRef" class="catalog-search-bar">
    <div class="search-panel-wrap search-panel-wrap--location">
      <FormSearchTextField
        class="search-panel"
        :model-value="localLocationQuery"
        :active="hasLocationDropdown"
        input-id="catalog-location"
        placeholder="Région, Département, Ville, Adresse..."
        autocomplete="off"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="hasLocationDropdown ? 'true' : 'false'"
        :aria-controls="locationListId"
        :aria-activedescendant="activeLocationDescendant"
        clear-label="Effacer le lieu"
        @focus="handleLocationFocus"
        @keydown="handleLocationKeydown"
        @update:model-value="handleLocationInput"
        @clear="clearLocation"
      >
        <template #leading>
          <svg class="search-field__leading-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 21s-5.5-5.2-5.5-11A5.5 5.5 0 1117.5 10c0 5.8-5.5 11-5.5 11z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            <circle cx="12" cy="10" r="2.5" fill="currentColor"/>
          </svg>
        </template>
      </FormSearchTextField>

      <div
        v-if="hasLocationDropdown"
        :id="locationListId"
        class="location-dropdown"
        role="listbox"
      >
        <UiStatusState
          v-if="isLoadingLocations"
          class="location-dropdown__status"
          state="loading"
          loading-label="Recherche des lieux..."
          compact
        />

        <UiStatusState
          v-else-if="hasLocationSuggestionsError"
          class="location-dropdown__status"
          state="error"
          title="Impossible de charger les lieux"
          message="Le serveur ne répond pas"
          compact
        />

        <template v-else-if="locationSuggestions.length > 0">
          <button
            v-for="(suggestion, index) in locationSuggestions"
            :id="`catalog-location-option-${suggestion.id}`"
            :key="suggestion.id"
            type="button"
            class="location-dropdown__option"
            :class="{ 'is-active': index === activeLocationIndex }"
            role="option"
            :aria-selected="index === activeLocationIndex ? 'true' : 'false'"
            @mouseenter="activeLocationIndex = index"
            @mousedown.prevent="selectLocationSuggestion(suggestion)"
          >
            <UiBadge class="location-dropdown__badge" tone="surface" size="sm">
              {{ locationTypeLabels[suggestion.type] }}
            </UiBadge>
            <span class="location-dropdown__text">
              <span class="location-dropdown__label">{{ suggestion.label }}</span>
              <span v-if="suggestion.secondaryLabel" class="location-dropdown__meta">{{ suggestion.secondaryLabel }}</span>
            </span>
          </button>
        </template>

        <div v-else class="location-dropdown__state">
          Aucun lieu pertinent trouvé.
        </div>
      </div>
    </div>

    <div ref="datePanelRef" class="search-panel-wrap search-panel-wrap--date">
      <UiInputFrame class="search-panel">
        <template #leading>
          <svg class="search-field__leading-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" stroke-width="1.8"/>
            <path d="M8 3v4M16 3v4M4 9h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </template>

        <VueDatePicker
          :model-value="localDate"
          @update:model-value="handleDateChange"
          @open="handleDateOpen"
          @closed="handleDateMenuClosed"
          model-type="yyyy-MM-dd"
          :formats="{ input: 'd MMMM yyyy' }"
          :locale="fr"
          :enable-time-picker="false"
          :time-config="DATEPICKER_TIME_CONFIG"
          :hide-navigation="DATEPICKER_HIDE_NAVIGATION"
          :action-row="{
            showSelect: false,
            showCancel: false,
            showNow: false,
            showPreview: false
          }"
          :input-attrs="{
            hideInputIcon: true,
            inputmode: 'none'
          }"
          placeholder="Année, Mois, Jour..."
          auto-apply
          :clearable="false"
          :transitions="false"
          :menu-id="dateMenuId"
          :teleport="true"
        />

        <template v-if="localDate" #trailing>
          <UiFieldClearButton
            class="search-field__clear"
            label="Effacer la date"
            @click="clearDate"
          />
        </template>
      </UiInputFrame>
    </div>
  </div>
</template>

<style scoped>
.catalog-search-bar {
  display: flex;
  align-items: stretch;
  gap: var(--space-3);
  overflow: visible;
}

.search-panel-wrap {
  display: flex;
  min-width: 0;
  flex: 1;
  position: relative;
  overflow: visible;
}

.search-panel {
  width: 100%;
}

.search-panel-wrap--location {
  flex: 1.15;
  z-index: var(--z-surface-floating);
}

.search-panel-wrap--date {
  flex: 0.95;
  z-index: var(--z-surface-stacked);
}

.search-field__leading-icon {
  display: block;
  pointer-events: none;
}

.location-dropdown {
  position: absolute;
  top: calc(100% + 0.7rem);
  left: -0.1rem;
  right: -0.1rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2);
  background: var(--color-bg);
  border: var(--floating-panel-border);
  border-radius: var(--floating-panel-radius);
  box-shadow: var(--floating-panel-shadow);
  z-index: var(--z-surface-dropdown);
  max-height: min(320px, 60vh);
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.location-dropdown::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.location-dropdown__option {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  width: 100%;
  padding: 0.7rem 0.85rem;
  border: none;
  border-radius: 18px;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
}

.location-dropdown__option:hover,
.location-dropdown__option.is-active {
  background: #f2f3f5;
}

.location-dropdown__badge {
  letter-spacing: 0.01em;
  flex-shrink: 0;
  margin-top: 0.08rem;
}

.location-dropdown__text {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
}

.location-dropdown__label {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-text);
}

.location-dropdown__meta,
.location-dropdown__state {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.location-dropdown__state {
  padding: 0.8rem 0.9rem;
}

.location-dropdown__status {
  width: 100%;
}

/* Override VueDatePicker input styles to match our design */
:deep(.dp__input_wrap) {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  height: calc(var(--input-height) - 2px);
  min-height: calc(var(--input-height) - 2px);
  box-sizing: border-box;
}

:deep(.dp__menu_inner),
:deep(.dp__calendar_wrap),
:deep(.dp__instance_calendar),
:deep(.dp__calendar),
:deep(.dp__month_year_wrap) {
  background: var(--color-bg) !important;
}

:deep(.dp__action_row),
:deep(.dp--time-overlay-btn) {
  display: none !important;
}

:global(#catalog-date-menu .dp__action_row),
:global(#catalog-date-menu .dp--time-overlay-btn),
:global(#catalog-date-menu [data-test-id='open-time-picker-btn']),
:global(#catalog-date-menu [data-test-id='close-time-picker-btn']) {
  display: none !important;
}

:deep(.dp__input) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  width: 100% !important;
  padding: 0 !important;
  padding-block: 0 !important;
  font: inherit !important;
  font-size: 0.875rem !important;
  color: var(--color-text) !important;
  height: calc(var(--input-height) - 2px) !important;
  min-height: calc(var(--input-height) - 2px) !important;
  line-height: calc(var(--input-height) - 2px) !important;
  align-self: center !important;
}

:deep(.dp__input::placeholder) {
  color: var(--color-text-muted) !important;
}

:deep(.dp--clear-btn),
:deep(.dp__input_icon),
:deep(.dp__clear_icon) {
  display: none !important;
}

:deep(.dp__input_wrap .dp__input_icon_pad) {
  padding-left: 0 !important;
}

@media (max-width: 1024px) {
  .catalog-search-bar {
    flex-direction: column;
    gap: var(--space-3);
  }

  .location-dropdown {
    left: 0;
    right: 0;
  }
}
</style>
