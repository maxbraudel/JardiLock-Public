<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useOverlayRoute } from '~/composables/useOverlayRoute'

const props = defineProps({
  mode: { type: String as () => 'login' | 'register', required: true }
})

const { login, register, isAuthenticated } = useAuth()
const { closeAuth, openLogin, openRegister } = useOverlayRoute()

const displayName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const submitting = ref(false)

const isLogin = computed(() => props.mode === 'login')

const isValid = computed(() => {
  if (isLogin.value) {
    return email.value.includes('@') && password.value.length >= 6
  }

  return (
    displayName.value.trim().length >= 2 &&
    email.value.includes('@') &&
    password.value.length >= 6 &&
    password.value === confirmPassword.value
  )
})

const passwordMismatch = computed(() => {
  return !isLogin.value && confirmPassword.value.length > 0 && password.value !== confirmPassword.value
})

async function handleSubmit() {
  if (!isValid.value) return
  submitting.value = true
  errorMsg.value = ''

  try {
    if (isLogin.value) {
      await login(email.value, password.value)
    } else {
      await register(displayName.value.trim(), email.value, password.value)
    }

    closeAuth()
  } catch (cause) {
    errorMsg.value = cause instanceof Error ? cause.message : 'Une erreur est survenue.'
  } finally {
    submitting.value = false
  }
}

watch(isAuthenticated, value => {
  if (value) {
    closeAuth()
  }
})
</script>

<template>
  <UiModalShell
    :title="isLogin ? 'Connexion' : 'Inscription'"
    compact
    header-close-label="Fermer"
    header-close-show-label
    header-close-responsive-icon-only
    @close="closeAuth"
  >
    <div class="auth-overlay-body">
      <p class="auth-subtitle">
        {{ isLogin ? 'Connectez-vous à votre compte JardiLock' : 'Créez votre compte JardiLock' }}
      </p>

      <div v-if="errorMsg" class="auth-error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/></svg>
        {{ errorMsg }}
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <UiInput
          v-if="!isLogin"
          v-model="displayName"
          label="Nom d'affichage"
          type="text"
          placeholder="Votre nom"
          autocomplete="name"
        />

        <UiInput
          v-model="email"
          label="Email"
          type="email"
          placeholder="nom@exemple.com"
          autocomplete="email"
        />

        <UiInput
          v-model="password"
          label="Mot de passe"
          type="password"
          :placeholder="isLogin ? '••••••' : '6 caractères minimum'"
          :autocomplete="isLogin ? 'current-password' : 'new-password'"
        />

        <UiInput
          v-if="!isLogin"
          v-model="confirmPassword"
          label="Confirmer le mot de passe"
          type="password"
          placeholder="Identique au mot de passe"
          autocomplete="new-password"
          :error="passwordMismatch ? 'Les mots de passe ne correspondent pas' : ''"
        />

        <UiButton type="submit" variant="primary" block :disabled="!isValid || submitting">
          {{ submitting ? (isLogin ? 'Connexion...' : 'Inscription...') : (isLogin ? 'Se connecter' : "S'inscrire") }}
        </UiButton>
      </form>

      <p class="auth-footer">
        <template v-if="isLogin">
          Pas encore de compte ?
          <UiButton type="button" variant="text" size="sm" @click="openRegister()">Créer un compte</UiButton>
        </template>
        <template v-else>
          Déjà un compte ?
          <UiButton type="button" variant="text" size="sm" @click="openLogin()">Se connecter</UiButton>
        </template>
      </p>
    </div>
  </UiModalShell>
</template>

<style scoped>
.auth-overlay-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding-block: var(--space-6);
  padding-inline-start: var(--page-gutter-safe-inline-start);
  padding-inline-end: var(--page-gutter-safe-inline-end);
}

.auth-subtitle {
  text-align: left;
  color: var(--color-text-light);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-danger-light);
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  color: var(--color-danger);
  font-size: 0.9rem;
  margin-bottom: var(--space-4);
}

.auth-footer {
  text-align: center;
  margin-top: var(--space-5);
  font-size: 0.9rem;
  color: var(--color-text-light);
}
</style>