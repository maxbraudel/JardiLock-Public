import { readonly, ref } from 'vue'

type ToastTone = 'info' | 'success' | 'error'

type ToastOptions = {
  duration?: number
  tone?: ToastTone
}

export type ToastItem = {
  id: number
  message: string
  tone: ToastTone
}

const DEFAULT_TOAST_DURATION_MS = 3200

const toasts = ref<ToastItem[]>([])
const timers = new Map<number, ReturnType<typeof setTimeout>>()

let nextToastId = 1

function clearToastTimer(toastId: number) {
  const timer = timers.get(toastId)
  if (!timer) {
    return
  }

  clearTimeout(timer)
  timers.delete(toastId)
}

export function useToast() {
  function dismissToast(toastId: number) {
    clearToastTimer(toastId)
    toasts.value = toasts.value.filter((toast) => toast.id !== toastId)
  }

  function clearToasts() {
    Array.from(timers.keys()).forEach(clearToastTimer)
    toasts.value = []
  }

  function showToast(message: string, options: ToastOptions = {}) {
    const id = nextToastId++
    const duration = options.duration ?? DEFAULT_TOAST_DURATION_MS
    const tone = options.tone ?? 'info'

    toasts.value = [...toasts.value, { id, message, tone }]

    if (duration > 0) {
      const timer = setTimeout(() => {
        dismissToast(id)
      }, duration)

      timers.set(id, timer)
    }

    return id
  }

  function showComingSoonToast(featureLabel?: string) {
    const message = featureLabel
      ? `La fonctionnalite "${featureLabel}" est prevue pour plus tard.`
      : 'Cette fonctionnalite est prevue pour plus tard.'

    return showToast(message)
  }

  return {
    toasts: readonly(toasts),
    showToast,
    showComingSoonToast,
    dismissToast,
    clearToasts
  }
}