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

function saveToken(value: string | null) {
  if (typeof window === 'undefined') return
  if (value && value !== COOKIE_SESSION_TOKEN) {
    localStorage.setItem(STORAGE_KEYS.authToken, value)
  } else {
    localStorage.removeItem(STORAGE_KEYS.authToken)
  }
}

function loadStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEYS.authToken) || null
}

const user = ref<AuthUser | null>(null)
const token = ref<string | null>(loadStoredToken())

export function useAuth() {
  const isAuthenticated = computed(() => !!user.value || !!token.value)

  async function login(email: string, password: string) {
    const data = await loginUser(email, password)
    token.value = data.token || COOKIE_SESSION_TOKEN
    user.value = data.user
    saveToken(token.value)
  }

  async function register(displayName: string, email: string, password: string) {
    const data = await registerUser(displayName, email, password)
    token.value = data.token || COOKIE_SESSION_TOKEN
    user.value = data.user
    saveToken(token.value)
  }

  async function logout() {
    try {
      await logoutUser()
    } catch {
      // Clear local state even if the server-side cookie was already absent.
    }

    token.value = null
    user.value = null
    saveToken(null)
  }

  async function loadProfile() {
    if (!token.value) {
      token.value = loadStoredToken()
    }

    try {
      user.value = await fetchUserProfile(token.value)
      if (!token.value) {
        token.value = COOKIE_SESSION_TOKEN
      }
    } catch {
      token.value = null
      user.value = null
      saveToken(null)
    }
  }

  return { user, token, isAuthenticated, login, register, logout, loadProfile }
}
