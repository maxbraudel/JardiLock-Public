import type { AuthSession, AuthUser } from '~/types/domain'
import {
  normalizeAuthSession,
  normalizeAuthUser
} from './normalizers'
import {
  createJsonRequestOptions,
  createRequestOptions,
  getApiBase,
  parseJsonResponse
} from './runtime'

export async function loginUser(email: string, password: string): Promise<AuthSession> {
  const response = await fetch(
    `${getApiBase()}/auth/login`,
    createJsonRequestOptions('POST', { email, password })
  )

  if (!response.ok) {
    const err = await parseJsonResponse<{ error?: string }>(response).catch(() => ({ error: 'Login failed' }))
    throw new Error(err.error || 'Invalid credentials')
  }

  const payload = await parseJsonResponse<unknown>(response)
  return normalizeAuthSession(payload)
}

export async function registerUser(displayName: string, email: string, password: string): Promise<AuthSession> {
  const response = await fetch(
    `${getApiBase()}/auth/register`,
    createJsonRequestOptions('POST', { display_name: displayName, email, password })
  )

  if (!response.ok) {
    const err = await parseJsonResponse<{ error?: string }>(response).catch(() => ({ error: 'Registration failed' }))
    throw new Error(err.error || 'Registration failed')
  }

  const payload = await parseJsonResponse<unknown>(response)
  return normalizeAuthSession(payload)
}

export async function fetchUserProfile(token?: string | null): Promise<AuthUser> {
  const response = await fetch(`${getApiBase()}/users/me`, createRequestOptions(token))

  if (!response.ok) throw new Error('Failed to fetch profile')

  const payload = await parseJsonResponse<unknown>(response)
  return normalizeAuthUser(payload)
}

export async function logoutUser() {
  const response = await fetch(`${getApiBase()}/auth/logout`, createJsonRequestOptions('POST'))
  if (!response.ok && response.status !== 204) {
    throw new Error('Logout failed')
  }
}