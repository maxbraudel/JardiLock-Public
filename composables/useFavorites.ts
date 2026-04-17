import { ref, computed } from 'vue'
import { STORAGE_KEYS } from '~/utils/appState'

function getStoredFavorites() {
  if (typeof window === 'undefined') return [] as string[]

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites) || '[]')
    return Array.isArray(parsed) ? parsed.map((value) => String(value)) : []
  } catch {
    return []
  }
}

function normalizeFavoriteId(listingId: string | number) {
  return String(listingId)
}

const favorites = ref<string[]>(getStoredFavorites())

export function useFavorites() {
  const favoriteCount = computed(() => favorites.value.length)

  function isFavorite(listingId: string | number): boolean {
    return favorites.value.includes(normalizeFavoriteId(listingId))
  }

  function toggleFavorite(listingId: string | number) {
    const normalizedId = normalizeFavoriteId(listingId)
    const index = favorites.value.indexOf(normalizedId)
    if (index === -1) {
      favorites.value.push(normalizedId)
    } else {
      favorites.value.splice(index, 1)
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites.value))
    }
  }

  function clearFavorites() {
    favorites.value = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.favorites)
    }
  }

  return { favorites, favoriteCount, isFavorite, toggleFavorite, clearFavorites }
}
