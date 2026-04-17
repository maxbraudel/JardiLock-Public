<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import clearDayIcon from '@meteocons/svg/fill/clear-day.svg?url'
import clearNightIcon from '@meteocons/svg/fill/clear-night.svg?url'
import mostlyClearDayIcon from '@meteocons/svg/fill/mostly-clear-day.svg?url'
import mostlyClearNightIcon from '@meteocons/svg/fill/mostly-clear-night.svg?url'
import partlyCloudyDayIcon from '@meteocons/svg/fill/partly-cloudy-day.svg?url'
import partlyCloudyNightIcon from '@meteocons/svg/fill/partly-cloudy-night.svg?url'
import overcastDayIcon from '@meteocons/svg/fill/overcast-day.svg?url'
import overcastNightIcon from '@meteocons/svg/fill/overcast-night.svg?url'
import fogDayIcon from '@meteocons/svg/fill/fog-day.svg?url'
import fogNightIcon from '@meteocons/svg/fill/fog-night.svg?url'
import drizzleDayIcon from '@meteocons/svg/fill/overcast-day-drizzle.svg?url'
import drizzleNightIcon from '@meteocons/svg/fill/overcast-night-drizzle.svg?url'
import rainDayIcon from '@meteocons/svg/fill/overcast-day-rain.svg?url'
import rainNightIcon from '@meteocons/svg/fill/overcast-night-rain.svg?url'
import snowDayIcon from '@meteocons/svg/fill/overcast-day-snow.svg?url'
import snowNightIcon from '@meteocons/svg/fill/overcast-night-snow.svg?url'
import stormDayIcon from '@meteocons/svg/fill/thunderstorms-overcast-day.svg?url'
import stormNightIcon from '@meteocons/svg/fill/thunderstorms-overcast-night.svg?url'
import hailDayIcon from '@meteocons/svg/fill/thunderstorms-overcast-day-hail.svg?url'
import hailNightIcon from '@meteocons/svg/fill/thunderstorms-overcast-night-hail.svg?url'

type WeatherIconSet = {
  day: string
  night: string
}

type WeatherCodeConfig = {
  label: string
  accentClass: string
  icons: WeatherIconSet
}

type WeatherResponse = {
  current?: {
    temperature_2m?: number
    weather_code?: number
    wind_speed_10m?: number
    is_day?: number
  }
  daily?: {
    time?: string[]
    weather_code?: number[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    precipitation_probability_max?: number[]
    wind_speed_10m_max?: number[]
  }
}

type ForecastDay = {
  key: string
  shortLabel: string
  longLabel: string
  dateLabel: string
  summary: WeatherCodeConfig
  temperatureMaxValue: number | null
  temperatureMinValue: number | null
  temperatureMax: string
  temperatureMin: string
  precipitation: number | null
  wind: number | null
}

const props = defineProps({
  city: { type: String, default: '' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true }
})

const weather = ref<WeatherResponse | null>(null)
const isLoading = ref(false)
const loadError = ref(false)

const clearIcons: WeatherIconSet = { day: clearDayIcon, night: clearNightIcon }
const mostlyClearIcons: WeatherIconSet = { day: mostlyClearDayIcon, night: mostlyClearNightIcon }
const partlyCloudyIcons: WeatherIconSet = { day: partlyCloudyDayIcon, night: partlyCloudyNightIcon }
const overcastIcons: WeatherIconSet = { day: overcastDayIcon, night: overcastNightIcon }
const fogIcons: WeatherIconSet = { day: fogDayIcon, night: fogNightIcon }
const drizzleIcons: WeatherIconSet = { day: drizzleDayIcon, night: drizzleNightIcon }
const rainIcons: WeatherIconSet = { day: rainDayIcon, night: rainNightIcon }
const snowIcons: WeatherIconSet = { day: snowDayIcon, night: snowNightIcon }
const stormIcons: WeatherIconSet = { day: stormDayIcon, night: stormNightIcon }
const hailIcons: WeatherIconSet = { day: hailDayIcon, night: hailNightIcon }

const weatherCodeMap: Record<number, WeatherCodeConfig> = {
  0: { label: 'Ciel degage', accentClass: 'is-clear', icons: clearIcons },
  1: { label: 'Plutot degage', accentClass: 'is-clear', icons: mostlyClearIcons },
  2: { label: 'Partiellement nuageux', accentClass: 'is-cloudy', icons: partlyCloudyIcons },
  3: { label: 'Couvert', accentClass: 'is-cloudy', icons: overcastIcons },
  45: { label: 'Brouillard', accentClass: 'is-fog', icons: fogIcons },
  48: { label: 'Brouillard givrant', accentClass: 'is-fog', icons: fogIcons },
  51: { label: 'Bruine legere', accentClass: 'is-rain', icons: drizzleIcons },
  53: { label: 'Bruine', accentClass: 'is-rain', icons: drizzleIcons },
  55: { label: 'Bruine dense', accentClass: 'is-rain', icons: drizzleIcons },
  56: { label: 'Bruine verglaçante', accentClass: 'is-rain', icons: drizzleIcons },
  57: { label: 'Bruine verglaçante forte', accentClass: 'is-rain', icons: drizzleIcons },
  61: { label: 'Pluie legere', accentClass: 'is-rain', icons: rainIcons },
  63: { label: 'Pluie', accentClass: 'is-rain', icons: rainIcons },
  65: { label: 'Forte pluie', accentClass: 'is-rain', icons: rainIcons },
  66: { label: 'Pluie verglaçante', accentClass: 'is-rain', icons: rainIcons },
  67: { label: 'Forte pluie verglaçante', accentClass: 'is-rain', icons: rainIcons },
  71: { label: 'Neige legere', accentClass: 'is-snow', icons: snowIcons },
  73: { label: 'Neige', accentClass: 'is-snow', icons: snowIcons },
  75: { label: 'Forte neige', accentClass: 'is-snow', icons: snowIcons },
  77: { label: 'Grains de neige', accentClass: 'is-snow', icons: snowIcons },
  80: { label: 'Averses legeres', accentClass: 'is-rain', icons: rainIcons },
  81: { label: 'Averses', accentClass: 'is-rain', icons: rainIcons },
  82: { label: 'Fortes averses', accentClass: 'is-rain', icons: rainIcons },
  85: { label: 'Averses de neige', accentClass: 'is-snow', icons: snowIcons },
  86: { label: 'Fortes averses de neige', accentClass: 'is-snow', icons: snowIcons },
  95: { label: 'Orage', accentClass: 'is-storm', icons: stormIcons },
  96: { label: 'Orage avec grele', accentClass: 'is-storm', icons: hailIcons },
  99: { label: 'Fort orage avec grele', accentClass: 'is-storm', icons: hailIcons }
}

const fallbackWeather: WeatherCodeConfig = {
  label: 'Conditions variables',
  accentClass: 'is-cloudy',
  icons: overcastIcons
}

function getWeatherCodeConfig(code?: number | null) {
  if (code == null) return fallbackWeather
  return weatherCodeMap[code] || fallbackWeather
}

function formatTemperature(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '--'
  return `${Math.round(value)}°`
}

function formatWind(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '--'
  return `${Math.round(value)} km/h`
}

function formatNumericValue(value?: number | null) {
  if (value == null || Number.isNaN(value)) return null
  return Math.round(value)
}

function formatDayLabel(value: string, index: number, format: 'short' | 'long' = 'short') {
  if (index === 0) return 'Aujourd\'hui'

  const date = new Date(value)
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: format,
    ...(format === 'long' ? {} : {})
  }).format(date)
}

function formatDateLabel(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short'
  }).format(date)
}

const currentSummary = computed(() => {
  return getWeatherCodeConfig(weather.value?.current?.weather_code)
})

const currentIcon = computed(() => {
  if (weather.value?.current?.is_day === 0) {
    return currentSummary.value.icons.night
  }

  return currentSummary.value.icons.day
})

const forecastDays = computed(() => {
  const daily = weather.value?.daily

  if (!daily?.time?.length) {
    return [] as ForecastDay[]
  }

  return daily.time.map((date, index) => ({
    key: `${date}-${index}`,
    shortLabel: formatDayLabel(date, index, 'short'),
    longLabel: formatDayLabel(date, index, 'long'),
    dateLabel: formatDateLabel(date),
    summary: getWeatherCodeConfig(daily.weather_code?.[index]),
    temperatureMaxValue: formatNumericValue(daily.temperature_2m_max?.[index]),
    temperatureMinValue: formatNumericValue(daily.temperature_2m_min?.[index]),
    temperatureMax: formatTemperature(daily.temperature_2m_max?.[index]),
    temperatureMin: formatTemperature(daily.temperature_2m_min?.[index]),
    precipitation: formatNumericValue(daily.precipitation_probability_max?.[index]),
    wind: formatNumericValue(daily.wind_speed_10m_max?.[index])
  }))
})

const bookingHighlight = computed(() => {
  if (!forecastDays.value.length) {
    return null
  }

  const candidateDays = forecastDays.value.length > 1
    ? forecastDays.value.slice(1)
    : forecastDays.value

  const bestDay = [...candidateDays]
    .map(day => ({
      day,
      score:
        (day.temperatureMaxValue ?? 0) * 2.2 -
        (day.precipitation ?? 50) * 1.3 -
        (day.wind ?? 20) * 0.6
    }))
    .sort((left, right) => right.score - left.score)[0]?.day

  if (!bestDay) {
    return null
  }

  return {
    label: `Créneau conseillé : ${bestDay.longLabel}`,
    icon: bestDay.summary.icons.day,
    condition: bestDay.summary.label,
    accentClass: bestDay.summary.accentClass,
    temp: bestDay.temperatureMax,
    wind: bestDay.wind != null ? `${bestDay.wind} km/h` : '--'
  }
})

const weatherRangeLabel = computed(() => {
  const days = forecastDays.value.length
  return days ? `Previsions sur ${days} jours` : 'Previsions'
})

async function loadWeather() {
  if (!Number.isFinite(props.latitude) || !Number.isFinite(props.longitude)) {
    weather.value = null
    loadError.value = true
    return
  }

  isLoading.value = true
  loadError.value = false

  try {
    weather.value = await $fetch<WeatherResponse>('https://api.open-meteo.com/v1/forecast', {
      query: {
        latitude: props.latitude,
        longitude: props.longitude,
        current: 'temperature_2m,weather_code,wind_speed_10m,is_day',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
        timezone: 'auto',
        forecast_days: 16
      }
    })
  } catch {
    weather.value = null
    loadError.value = true
  } finally {
    isLoading.value = false
  }
}

watch(() => [props.latitude, props.longitude], loadWeather, { immediate: true })
</script>

<template>
  <div v-if="city" class="weather-widget">
    <h3>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="var(--color-primary)"/></svg>
      Météo
    </h3>
    <p class="weather-city">Prévisions pour {{ city }}</p>

    <div v-if="isLoading" class="weather-card weather-card-state">
      Chargement de la meteo...
    </div>

    <div v-else-if="loadError || !weather" class="weather-card weather-card-state">
      Impossible de charger la meteo pour le moment.
    </div>

    <div v-else class="weather-card">
      <div class="weather-top-grid">
        <div class="weather-current" :class="currentSummary.accentClass">
          <p class="weather-now-label">En ce moment</p>
          <div class="weather-current-main">
            <img
              :src="currentIcon"
              :alt="currentSummary.label"
              class="weather-current-icon"
            />
            <p class="weather-current-temp">{{ formatTemperature(weather.current?.temperature_2m) }}</p>
            <div class="weather-current-meta">
              <p class="weather-condition">{{ currentSummary.label }}</p>
              <p class="weather-wind">Vent {{ formatWind(weather.current?.wind_speed_10m) }}</p>
            </div>
          </div>
        </div>

        <div v-if="bookingHighlight" class="weather-highlight">
          <p class="weather-now-label">{{ bookingHighlight.label }}</p>
          <div class="weather-current-main">
            <img
              :src="bookingHighlight.icon"
              :alt="bookingHighlight.condition"
              class="weather-current-icon"
            />
            <p class="weather-current-temp">{{ bookingHighlight.temp }}</p>
            <div class="weather-current-meta">
              <p class="weather-condition">{{ bookingHighlight.condition }}</p>
              <p class="weather-wind">Vent {{ bookingHighlight.wind }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="weather-forecast-header">
        <div>
          <p class="weather-forecast-kicker">Planning meteo</p>
          <p class="weather-forecast-title">{{ weatherRangeLabel }}</p>
        </div>
      </div>

      <UiHorizontalScroll
        :scroll-step="200"
        item-align="center"
        item-selector=".weather-day"
      >
        <div class="weather-forecast-strip" role="list" aria-label="Previsions meteo sur 16 jours">
        <article
          v-for="day in forecastDays"
          :key="day.key"
          class="weather-day"
          role="listitem"
        >
          <p class="weather-day-label">{{ day.shortLabel }}</p>
          <p class="weather-day-date">{{ day.dateLabel }}</p>
          <div class="weather-day-icon-row">
            <img :src="day.summary.icons.day" :alt="day.summary.label" class="weather-day-icon" />
            <p class="weather-day-condition">{{ day.summary.label }}</p>
          </div>
          <p class="weather-day-temps">{{ day.temperatureMax }} / {{ day.temperatureMin }}</p>
          <p class="weather-day-rain">
            Pluie {{ day.precipitation == null ? '--' : `${day.precipitation}%` }}
          </p>
          <p class="weather-day-rain">Vent {{ day.wind == null ? '--' : `${day.wind} km/h` }}</p>
        </article>
        </div>
      </UiHorizontalScroll>

      <p class="weather-source">Source: Open-Meteo, jusqu'a 16 jours de prevision.</p>
    </div>
  </div>
</template>

<style scoped>
.weather-widget {
  margin-top: var(--space-4);
}

.weather-widget h3 {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 0.75rem;
}

.weather-city {
  margin: 0 0 0.75rem;
  color: var(--color-text-light);
  font-size: 0.95rem;
}

.weather-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--color-bg);
}

.weather-card-state {
  color: var(--color-text-light);
  font-size: 0.94rem;
}

.weather-top-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.weather-current {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #fff5f6 0%, #fff 100%);
}

.weather-highlight {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid rgba(225, 44, 66, 0.16);
  background: linear-gradient(135deg, rgba(225, 44, 66, 0.06) 0%, #fff 100%);
}

.weather-highlight-label,
.weather-forecast-kicker,
.weather-forecast-title,
.weather-day-date {
  margin: 0;
}

.weather-highlight-label,
.weather-forecast-kicker {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.weather-current.is-clear {
  background: linear-gradient(135deg, #fff3df 0%, #fff 100%);
}

.weather-current.is-cloudy {
  background: linear-gradient(135deg, #f4f6fb 0%, #fff 100%);
}

.weather-current.is-fog {
  background: linear-gradient(135deg, #f0f1f3 0%, #fff 100%);
}

.weather-current.is-rain {
  background: linear-gradient(135deg, #edf4ff 0%, #fff 100%);
}

.weather-current.is-snow {
  background: linear-gradient(135deg, #f7fbff 0%, #fff 100%);
}

.weather-current.is-storm {
  background: linear-gradient(135deg, #f9eef5 0%, #fff 100%);
}

.weather-now-label {
  margin: 0;
  color: var(--color-text-light);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.weather-current-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: var(--space-2);
}

.weather-current-icon {
  width: 72px;
  height: 72px;
  flex: 0 0 72px;
}

.weather-current-temp {
  margin: 0;
  font-size: 2.3rem;
  line-height: 1;
  font-weight: 800;
  color: var(--color-primary);
}

.weather-current-meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.weather-condition,
.weather-wind,
.weather-day-label,
.weather-day-date,
.weather-day-condition,
.weather-day-temps,
.weather-day-rain,
.weather-source {
  margin: 0;
}

.weather-condition {
  font-size: 1rem;
  font-weight: var(--font-weight-semi-bold);
  color: var(--color-text);
}

.weather-wind {
  color: var(--color-text-light);
  font-size: 0.92rem;
}

.weather-forecast-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}

.weather-forecast-title {
  margin-top: var(--space-1);
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
}

.weather-forecast-strip {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: clamp(150px, 18vw, 220px);
  gap: 0.75rem;
  padding-bottom: var(--space-2);
  width: max-content;
  min-width: 100%;
}

.weather-day {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  min-width: 0;
  scroll-snap-align: center;
}

.weather-day-label {
  font-size: 0.86rem;
  font-weight: var(--font-weight-semi-bold);
  color: var(--color-text);
  text-transform: capitalize;
}

.weather-day-date {
  margin-top: 0.1rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.weather-day-condition {
  margin: 0;
  font-size: 0.88rem;
  color: var(--color-text-light);
  line-height: 1.4;
}

.weather-day-icon-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: var(--space-2);
}

.weather-day-icon {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
}

.weather-day-temps {
  margin-top: var(--space-2);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-primary);
}

.weather-day-rain {
  margin-top: var(--space-2);
  font-size: 0.84rem;
  color: var(--color-text-light);
}

.weather-source {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

@media (max-width: 640px) {
  .weather-top-grid {
    grid-template-columns: 1fr;
  }

  .weather-current-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .weather-current-icon {
    width: 64px;
    height: 64px;
    flex-basis: 64px;
  }

  .weather-forecast-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .weather-forecast-strip {
    grid-auto-columns: clamp(128px, 44vw, 176px);
  }
}
</style>
