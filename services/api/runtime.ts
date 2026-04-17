type RuntimeConfigGlobal = {
  __NUXT__?: {
    config?: {
      public?: {
        apiOrigin?: string
      }
    }
  }
  process?: {
    env?: {
      JARDILOCK_PUBLIC_API_ORIGIN?: string
    }
  }
}

export const COOKIE_SESSION_TOKEN = '__cookie_session__'

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'])

function normalizeApiOrigin(origin: string) {
  const trimmedOrigin = origin.trim().replace(/\/+$/, '')

  try {
    const url = new URL(trimmedOrigin)
    if (LOCAL_HOSTNAMES.has(url.hostname)) {
      url.hostname = '127.0.0.1'
    }
    return url.toString().replace(/\/+$/, '')
  } catch {
    return trimmedOrigin
  }
}

function getApiOrigin() {
  const runtimeGlobal = globalThis as typeof globalThis & RuntimeConfigGlobal
  const configuredOrigin = runtimeGlobal.__NUXT__?.config?.public?.apiOrigin
    || runtimeGlobal.process?.env?.JARDILOCK_PUBLIC_API_ORIGIN

  if (typeof configuredOrigin === 'string' && configuredOrigin.trim().length > 0) {
    return normalizeApiOrigin(configuredOrigin)
  }

  if (typeof window !== 'undefined') {
    const hostname = LOCAL_HOSTNAMES.has(window.location.hostname)
      ? '127.0.0.1'
      : window.location.hostname

    return `${window.location.protocol}//${hostname}:3001`
  }

  return 'http://127.0.0.1:3001'
}

export function getApiBase() {
  return `${getApiOrigin()}/api`
}

function shouldSendBearerToken(token: string | null | undefined) {
  return typeof token === 'string' && token.length > 0 && token !== COOKIE_SESSION_TOKEN
}

export function createJsonRequestOptions(method: string, body?: unknown, token?: string | null): RequestInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (shouldSendBearerToken(token)) {
    headers.Authorization = `Bearer ${token}`
  }

  return {
    method,
    headers,
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body)
  }
}

export function createRequestOptions(token?: string | null): RequestInit {
  const headers: Record<string, string> = {}

  if (shouldSendBearerToken(token)) {
    headers.Authorization = `Bearer ${token}`
  }

  return {
    headers,
    credentials: 'include'
  }
}

export function resolveApiAssetUrl(path: string | null | undefined) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return `${getApiOrigin()}${path}`
}

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || ''
  const bodyText = await response.text()

  if (!contentType.includes('application/json')) {
    if (bodyText.trim().startsWith('<!DOCTYPE') || bodyText.trim().startsWith('<html')) {
      throw new Error(`L'API ne répond pas correctement. Vérifiez que le serveur Express tourne bien sur ${getApiOrigin()}.`)
    }
    throw new Error('Réponse invalide du serveur API.')
  }

  try {
    return JSON.parse(bodyText) as T
  } catch {
    throw new Error('Impossible de lire la réponse JSON du serveur API.')
  }
}