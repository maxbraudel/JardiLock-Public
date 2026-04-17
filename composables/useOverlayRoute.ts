import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { APP_STATE_KEYS } from '~/utils/appState'

type AuthMode = 'login' | 'register'
type ViewerMode = 'gallery'
type OverlayViewId = 'listing' | 'viewer' | 'filters' | 'auth'

type OverlayView = {
  id: OverlayViewId
  label: string
  to: string
}

function formatSlugLabel(slug: string) {
  return decodeURIComponent(slug)
    .split('-')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function useOverlayRoute() {
  const route = useRoute()
  const router = useRouter()
  const listingTitle = useState<string | null>(APP_STATE_KEYS.overlayListingTitle, () => null)

  const hashParams = computed(() => {
    return new URLSearchParams(route.hash.startsWith('#') ? route.hash.slice(1) : route.hash)
  })

  const authMode = computed<AuthMode | null>(() => {
    const auth = hashParams.value.get('auth')
    return auth === 'login' || auth === 'register' ? auth : null
  })

  const listingSlug = computed(() => hashParams.value.get('listing'))
  const filtersMode = computed(() => {
    const filters = hashParams.value.get('filters')
    return filters === 'open' ? 'open' : null
  })
  const viewerMode = computed<ViewerMode | null>(() => {
    if (!listingSlug.value) return null

    const viewer = hashParams.value.get('viewer')
    return viewer === 'gallery' ? viewer : null
  })

  const viewerImageIndex = computed<number | null>(() => {
    if (!viewerMode.value) return null

    const rawIndex = hashParams.value.get('image')
    if (rawIndex === null) return null

    const parsed = Number.parseInt(rawIndex, 10)
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0
    }

    return parsed
  })

  const isListingOpen = computed(() => !!listingSlug.value)
  const isViewerOpen = computed(() => !!viewerMode.value)
  const isFiltersOpen = computed(() => !!filtersMode.value)
  const isAuthOpen = computed(() => !!authMode.value)

  const activeOverlay = computed<'none' | 'auth' | 'filters' | 'viewer' | 'listing'>(() => {
    if (authMode.value) return 'auth'
    if (filtersMode.value) return 'filters'
    if (viewerMode.value) return 'viewer'
    if (listingSlug.value) return 'listing'
    return 'none'
  })

  function buildHash(params: Record<string, string | null | undefined>) {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value)
      }
    })

    const hash = searchParams.toString()
    return hash ? `#${hash}` : ''
  }

  function currentHashObject(): Record<string, string> {
    const obj: Record<string, string> = {}
    hashParams.value.forEach((value, key) => {
      obj[key] = value
    })
    return obj
  }

  function navigateWithHash(path: string, params: Record<string, string | null | undefined>, replace = false) {
    return (replace ? router.replace : router.push)({
      path,
      query: route.query,
      hash: buildHash(params)
    })
  }

  function closeOverlay() {
    listingTitle.value = null
    return navigateWithHash(route.path, {}, true)
  }

  function closeAuth() {
    const current = currentHashObject()
    delete current.auth
    if (Object.keys(current).length === 0) {
      return closeOverlay()
    }
    return navigateWithHash(route.path, current, true)
  }

  function closeListing() {
    listingTitle.value = null
    const current = currentHashObject()
    delete current.listing
    delete current.viewer
    delete current.image
    if (Object.keys(current).length === 0) {
      return closeOverlay()
    }
    return navigateWithHash(route.path, current, true)
  }

  function openLogin(path = route.path) {
    const current = currentHashObject()
    current.auth = 'login'
    return navigateWithHash(path, current)
  }

  function openRegister(path = route.path) {
    const current = currentHashObject()
    current.auth = 'register'
    return navigateWithHash(path, current)
  }

  function openFilters(path = route.path) {
    const current = currentHashObject()
    current.filters = 'open'
    return navigateWithHash(path, current)
  }

  function closeFilters() {
    const current = currentHashObject()
    delete current.filters

    if (Object.keys(current).length === 0) {
      return closeOverlay()
    }

    return navigateWithHash(route.path, current, true)
  }

  function openListing(slug: string) {
    return navigateWithHash('/gardens', { listing: slug })
  }

  function openGalleryViewer(imageIndex?: number, path = route.path) {
    const current = currentHashObject()

    if (!current.listing && listingSlug.value) {
      current.listing = listingSlug.value
    }

    current.viewer = 'gallery'

    if (typeof imageIndex === 'number' && Number.isFinite(imageIndex) && imageIndex >= 0) {
      current.image = String(Math.floor(imageIndex))
    } else {
      delete current.image
    }

    return navigateWithHash(path, current)
  }

  function closeViewer() {
    const current = currentHashObject()
    delete current.viewer
    delete current.image

    if (Object.keys(current).length === 0) {
      return closeOverlay()
    }

    return navigateWithHash(route.path, current, true)
  }

  function setViewerImageIndex(index: number | null) {
    if (!isViewerOpen.value) return Promise.resolve()

    const current = currentHashObject()
    const nextValue =
      typeof index === 'number' && Number.isFinite(index) && index >= 0
        ? String(Math.floor(index))
        : null

    if ((current.image ?? null) === nextValue) {
      return Promise.resolve()
    }

    if (nextValue === null) {
      delete current.image
    } else {
      current.image = nextValue
    }

    return navigateWithHash(route.path, current, true)
  }

  function setListingTitle(title: string | null) {
    listingTitle.value = title
  }

  const overlayViews = computed<OverlayView[]>(() => {
    const views: OverlayView[] = []

    if (listingSlug.value) {
      views.push({
        id: 'listing',
        label: listingTitle.value || formatSlugLabel(listingSlug.value),
        to: `/gardens#listing=${encodeURIComponent(listingSlug.value)}`
      })
    }

    if (viewerMode.value && listingSlug.value) {
      const hashParts = [
        `listing=${encodeURIComponent(listingSlug.value)}`,
        `viewer=${viewerMode.value}`
      ]

      if (typeof viewerImageIndex.value === 'number') {
        hashParts.push(`image=${viewerImageIndex.value}`)
      }

      views.push({
        id: 'viewer',
        label: 'Visualiseur',
        to: `${route.path}#${hashParts.join('&')}`
      })
    }

    if (filtersMode.value) {
      const hashParts: string[] = []

      if (listingSlug.value) {
        hashParts.push(`listing=${encodeURIComponent(listingSlug.value)}`)
      }

      if (viewerMode.value) {
        hashParts.push(`viewer=${viewerMode.value}`)

        if (typeof viewerImageIndex.value === 'number') {
          hashParts.push(`image=${viewerImageIndex.value}`)
        }
      }

      hashParts.push('filters=open')

      views.push({
        id: 'filters',
        label: 'Filtres',
        to: `${route.path}#${hashParts.join('&')}`
      })
    }

    if (authMode.value) {
      const hashParts: string[] = []

      if (listingSlug.value) {
        hashParts.push(`listing=${encodeURIComponent(listingSlug.value)}`)
      }

      if (viewerMode.value) {
        hashParts.push(`viewer=${viewerMode.value}`)

        if (typeof viewerImageIndex.value === 'number') {
          hashParts.push(`image=${viewerImageIndex.value}`)
        }
      }

      if (filtersMode.value) {
        hashParts.push('filters=open')
      }

      hashParts.push(`auth=${authMode.value}`)

      views.push({
        id: 'auth',
        label: authMode.value === 'login' ? 'Connexion' : 'Inscription',
        to: `${route.path}#${hashParts.join('&')}`
      })
    }

    return views
  })

  const overlayBreadcrumbs = computed(() => {
    return overlayViews.value.map((view) => ({
      label: view.label,
      to: view.to
    }))
  })

  const overlayBreadcrumb = computed(() => {
    const crumbs = overlayBreadcrumbs.value
    return crumbs.length > 0 ? crumbs[crumbs.length - 1] : null
  })

  watch(() => listingSlug.value, value => {
    if (!value) {
      listingTitle.value = null
    }
  })

  return {
    activeOverlay,
    overlayViews,
    isListingOpen,
    isViewerOpen,
    isFiltersOpen,
    isAuthOpen,
    authMode,
    listingSlug,
    filtersMode,
    viewerMode,
    viewerImageIndex,
    overlayBreadcrumb,
    overlayBreadcrumbs,
    openLogin,
    openRegister,
    openFilters,
    openListing,
    openGalleryViewer,
    closeOverlay,
    closeAuth,
    closeFilters,
    closeListing,
    closeViewer,
    setViewerImageIndex,
    setListingTitle
  }
}