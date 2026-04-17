import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useToast().clearToasts()
  })

  afterEach(() => {
    useToast().clearToasts()
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('shows a toast and dismisses it after the provided duration', () => {
    const { showToast, toasts } = useToast()

    showToast('Toast de test', { duration: 1000 })

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]?.message).toBe('Toast de test')

    vi.advanceTimersByTime(1000)

    expect(toasts.value).toHaveLength(0)
  })

  it('builds a planned feature message', () => {
    const { showComingSoonToast, toasts } = useToast()

    showComingSoonToast('Mon profil')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]?.message).toBe('La fonctionnalite "Mon profil" est prevue pour plus tard.')
  })
})