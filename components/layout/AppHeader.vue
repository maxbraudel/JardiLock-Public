<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useOverlayRoute } from '~/composables/useOverlayRoute'
import { useToast } from '~/composables/useToast'
import { resolveApiAssetUrl } from '~/services/api'
import authActionIcon from '../../assets/images/icons/log_or_sign_in.svg'
import logoutIcon from '../../assets/images/icons/log_out.svg'
import publishListingIcon from '../../assets/images/icons/publier_annonce.svg'
import catalogIcon from '../../assets/images/icons/catalog.svg'
import userIcon from '../../assets/images/icons/user.svg'

const { isAuthenticated, user, logout, loadProfile } = useAuth()
const userMenuOpen = ref(false)
const userMenuRootRef = ref<HTMLElement | null>(null)
const route = useRoute()
const router = useRouter()
const { overlayViews, isViewerOpen, openLogin, openRegister } = useOverlayRoute()
const { showComingSoonToast } = useToast()
const userMenuPanelId = 'app-header-user-menu'

const routeLabels: Record<string, string> = {
  gardens: 'Catalogue',
  profile: 'Profil',
  login: 'Connexion',
  register: 'Inscription',
  create: 'Publier'
}

function formatSegmentLabel(segment: string) {
  const decodedSegment = decodeURIComponent(segment)

  if (routeLabels[decodedSegment]) {
    return routeLabels[decodedSegment]
  }

  return decodedSegment
    .split('-')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const breadcrumbs = computed(() => {
  const path = route.path.split('?')[0]
  const segments = path.split('/').filter(Boolean)
  const currentOverlayViews = overlayViews.value

  const baseCrumbs = segments.map((segment, index) => ({
    label: formatSegmentLabel(segment),
    to: `/${segments.slice(0, index + 1).join('/')}`,
    isCurrent: index === segments.length - 1 && currentOverlayViews.length === 0
  }))

  currentOverlayViews.forEach((view: { label: string; to: string }, index: number) => {
    baseCrumbs.push({
      label: view.label,
      to: view.to,
      isCurrent: index === currentOverlayViews.length - 1
    })
  })

  return baseCrumbs
})

const userDisplayName = computed(() => user.value?.display_name || 'Profil')

const userInitial = computed(() => {
  return userDisplayName.value.charAt(0)?.toUpperCase() || '?'
})

const userProfileImage = computed(() => {
  const profile = user.value

  if (!profile) {
    return ''
  }

  const rawPath =
    profile.avatar_url
    || profile.avatar
    || profile.profile_picture
    || profile.profile_picture_url
    || profile.profile_photo_url
    || profile.photo_url
    || profile.image_url

  if (!rawPath || typeof rawPath !== 'string') {
    return ''
  }

  return resolveApiAssetUrl(rawPath)
})

function goBack() {
  if (breadcrumbs.value.length >= 2) {
    router.push(breadcrumbs.value[breadcrumbs.value.length - 2].to)
  } else {
    router.push('/')
  }
}

function focusUserMenuToggle() {
  const toggleButton = userMenuRootRef.value?.querySelector('button')

  if (toggleButton instanceof HTMLElement) {
    toggleButton.focus({ preventScroll: true })
  }
}

function closeUserMenu(options: { restoreFocus?: boolean } = {}) {
  userMenuOpen.value = false

  if (options.restoreFocus) {
    void nextTick(() => {
      focusUserMenuToggle()
    })
  }
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function handleLogout() {
  void logout()
  closeUserMenu()
}

function handleComingSoonFeature(featureLabel: string) {
  closeUserMenu()
  showComingSoonToast(featureLabel)
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!userMenuOpen.value) {
    return
  }

  const root = userMenuRootRef.value

  if (!root || !(event.target instanceof Node) || root.contains(event.target)) {
    return
  }

  closeUserMenu()
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (!userMenuOpen.value || event.key !== 'Escape') {
    return
  }

  event.preventDefault()
  closeUserMenu({ restoreFocus: true })
}

onMounted(() => {
  void loadProfile()

  document.addEventListener('pointerdown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleDocumentKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeydown)
})

watch(() => route.fullPath, () => {
  closeUserMenu()
})
</script>

<template>
  <header v-if="!isViewerOpen" class="app-header">
    <div class="header-inner container">
      <div class="header-left">
        <NuxtLink to="/" class="logo">
          <svg class="logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
          </svg>
          <span class="logo-text">JardiLock</span>
        </NuxtLink>

        <nav v-if="breadcrumbs.length > 0" class="header-breadcrumb" aria-label="Fil d'Ariane">
          <template v-for="crumb in breadcrumbs" :key="crumb.to">
            <span class="breadcrumb-divider">/</span>
            <NuxtLink v-if="!crumb.isCurrent" :to="crumb.to" class="breadcrumb-link">
              {{ crumb.label }}
            </NuxtLink>
            <span v-else class="breadcrumb-current">{{ crumb.label }}</span>
          </template>
        </nav>

        <UiPillButton v-if="breadcrumbs.length > 0" class="back-btn" @click="goBack">
          <template #leading>
            <svg width="16" height="16" viewBox="0 -960 960 960" fill="none"><path d="M400-240 160-480l240-240 56 58-142 142h486v80H314l142 142-56 58Z" fill="currentColor"/></svg>
          </template>
          Retour
        </UiPillButton>
      </div>

      <div ref="userMenuRootRef" class="user-menu-root">
        <UiUserMenuButton
          class="user-menu-toggle"
          :authenticated="isAuthenticated"
          :display-name="userDisplayName"
          :profile-image="userProfileImage"
          :user-initial="userInitial"
          :open="userMenuOpen"
          :label="userMenuOpen ? 'Fermer le menu utilisateur' : 'Ouvrir le menu utilisateur'"
          aria-haspopup="true"
          :aria-expanded="userMenuOpen ? 'true' : 'false'"
          :aria-controls="userMenuPanelId"
          @click="toggleUserMenu"
        />
      </div>

      <Transition name="user-menu-fade">
        <div
          v-if="userMenuOpen"
          :id="userMenuPanelId"
          class="user-menu-panel"
          tabindex="-1"
          @keydown.esc.prevent.stop="closeUserMenu({ restoreFocus: true })"
        >
          <UiPillButton
            v-if="isAuthenticated"
            variant="primary"
            class="user-menu-action-btn"
            @click="handleComingSoonFeature('Mon profil')"
          >
            <template #leading>
              <img :src="userIcon" alt="" class="user-menu-link-icon user-menu-link-icon--light" aria-hidden="true">
            </template>
            Mon profil
          </UiPillButton>

          <section class="user-menu-section" aria-label="Actions utilisateur">
            <p class="user-menu-section-title">Actions</p>

            <template v-if="!isAuthenticated">
              <UiPillButton class="user-menu-action-btn" @click="openLogin(); closeUserMenu()">
                <template #leading>
                  <img :src="authActionIcon" alt="" class="user-menu-link-icon" aria-hidden="true">
                </template>
                Se connecter
              </UiPillButton>
              <UiPillButton class="user-menu-action-btn" @click="openRegister(); closeUserMenu()">
                <template #leading>
                  <img :src="authActionIcon" alt="" class="user-menu-link-icon" aria-hidden="true">
                </template>
                S'inscrire
              </UiPillButton>
            </template>

            <UiPillButton class="user-menu-action-btn" @click="handleComingSoonFeature('Publier une annonce')">
              <template #leading>
                <img :src="publishListingIcon" alt="" class="user-menu-link-icon" aria-hidden="true">
              </template>
              Publier une annonce
            </UiPillButton>

            <UiPillButton v-if="isAuthenticated" class="user-menu-action-btn" @click.stop.prevent="handleLogout()">
              <template #leading>
                <img :src="logoutIcon" alt="" class="user-menu-link-icon" aria-hidden="true">
              </template>
              Déconnexion
            </UiPillButton>
          </section>

          <section class="user-menu-section" aria-label="Navigation principale">
            <p class="user-menu-section-title">Navigation</p>
            <UiPillButton class="user-menu-action-btn" @click="router.push('/gardens'); closeUserMenu()">
              <template #leading>
                <img :src="catalogIcon" alt="" class="user-menu-link-icon" aria-hidden="true">
              </template>
              Catalogue
            </UiPillButton>
          </section>
        </div>
      </Transition>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  z-index: var(--z-header);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.user-menu-root {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  text-decoration: none;
}

.logo:hover {
  color: var(--color-primary);
}

.logo-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.header-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.breadcrumb-divider,
.breadcrumb-current,
.breadcrumb-link {
  font-size: 0.9rem;
}

.breadcrumb-divider {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.breadcrumb-link {
  color: var(--color-text-light);
  text-decoration: none;

  overflow: hidden;
  text-overflow: ellipsis;
}

.breadcrumb-link:hover {
  color: var(--color-primary);
}

.breadcrumb-current {
  color: var(--color-text);
  font-weight: var(--font-weight-semi-bold);
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 1024px) {
  .back-btn {
    display: none;
  }
}

.user-menu-panel {
  display: flex;
  position: absolute;
  top: calc(var(--header-height) + var(--floating-offset));
  right: var(--page-gutter-safe-inline-end);
  width: min(340px, calc(100vw - var(--page-gutter-safe-inline-start) - var(--page-gutter-safe-inline-end)));
  flex-direction: column;
  gap: 0.9rem;
  background: var(--color-bg);
  border: var(--floating-panel-border);
  border-radius: var(--floating-panel-radius);
  box-shadow: var(--floating-panel-shadow);
  padding: var(--page-gutter);
  z-index: var(--z-header-popover);
}

.user-menu-action-btn {
  width: 100%;
  justify-content: flex-start;
}

.user-menu-link-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  object-fit: contain;
}

.user-menu-link-icon--light {
  filter: brightness(0) invert(1);
}

.user-menu-section {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.user-menu-section-title {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  padding-left: 0.2rem;
}

.user-menu-fade-enter-active {
  transition: none;
}

.user-menu-fade-enter-from,
.user-menu-fade-enter-to {
  opacity: 1;
}

.user-menu-fade-leave-active {
  transition: opacity 0.1s ease;
}

.user-menu-fade-leave-from {
  opacity: 1;
}

.user-menu-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .header-breadcrumb {
    display: none;
  }

  .user-menu-toggle {
    margin-left: auto;
  }

  .user-menu-toggle--auth {
    --ui-button-height: var(--btn-height-touch);
  }

  .user-menu-panel {
    position: fixed;
    top: calc(var(--header-height) + var(--floating-offset-compact));
    right: var(--page-gutter-safe-inline-end);
    left: var(--page-gutter-safe-inline-start);
    width: auto;
    padding: var(--space-4);
  }
}
</style>
