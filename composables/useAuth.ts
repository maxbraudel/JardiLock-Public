import { ref, computed } from 'vue'
import {
  COOKIE_SESSION_TOKEN,
  fetchUserProfile,
  loginUser,
  logoutUser,
  registerUser
} from '~/services/api'
import type { AuthUser } from '~/types/domain'
import { STORAGE_KEYS } from '~/utils/appState'

function clearLegacyStoredToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.authToken)
}

const user = ref<AuthUser | null>(null)
const token = ref<string | null>(null)

export function useAuth() {
  const isAuthenticated = computed(() => !!user.value || !!token.value)

  async function login(email: string, password: string) {
    const data = await loginUser(email, password)
    token.value = data.token || COOKIE_SESSION_TOKEN
    user.value = data.user
    clearLegacyStoredToken()
  }

  async function register(displayName: string, email: string, password: string) {
    const data = await registerUser(displayName, email, password)
    token.value = data.token || COOKIE_SESSION_TOKEN
    user.value = data.user
    clearLegacyStoredToken()
  }

  async function logout() {
    try {
      await logoutUser()
    } catch {
      // Clear local state even if the server-side cookie was already absent.
    }

    token.value = null
    user.value = null
    clearLegacyStoredToken()
  }

  async function loadProfile() {
    clearLegacyStoredToken()

    try {
      user.value = await fetchUserProfile(token.value)
      token.value = COOKIE_SESSION_TOKEN
    } catch {
      token.value = null
      user.value = null
    }
  }

  return { user, token, isAuthenticated, login, register, logout, loadProfile }
}
