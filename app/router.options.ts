import type { RouterConfig } from '@nuxt/schema'

function isOverlayHash(hash: string) {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  return raw.includes('auth=') || raw.includes('listing=') || raw.includes('viewer=') || raw.includes('image=')
}

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    if (isOverlayHash(to.hash) || isOverlayHash(from.hash)) {
      return false
    }

    if (to.hash) {
      return {
        el: to.hash,
        top: 0,
        behavior: 'auto'
      }
    }

    return {
      left: 0,
      top: 0
    }
  }
}