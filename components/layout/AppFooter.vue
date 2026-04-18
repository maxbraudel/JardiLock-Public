<script setup lang="ts">
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<template>
  <footer class="app-footer">
    <div class="container">
      <div class="footer-shell">
        <div class="footer-top">
          <div>
            <p class="footer-brand">JardiLock</p>
            <p class="footer-tagline">Un catalogue simple pour trouver un jardin a louer, sans detour.</p>
          </div>
        </div>

        <div class="footer-bottom">
          <p>&copy; {{ currentYear }} JardiLock</p>
          <p>Catalogue de location de jardins</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  padding: var(--space-10) 0 var(--space-8);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: linear-gradient(180deg, rgba(250, 250, 250, 0.95), rgba(255, 255, 255, 1));
}

.footer-shell {
  width: min(100%, 980px);
  margin: 0 auto;
}

.footer-top,
.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.footer-top {
  padding-bottom: var(--space-6);
}

.footer-brand {
  font-size: 1.05rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
}

.footer-tagline,
.footer-bottom {
  color: var(--color-text-light);
}

.footer-tagline {
  margin-top: 0.3rem;
  max-width: 30rem;
}

.footer-link {
  color: var(--color-primary);
  font-weight: var(--font-weight-semi-bold);
}

.footer-bottom {
  padding-top: var(--space-5);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  font-size: 0.9rem;
}

@media (max-width: 700px) {
  .footer-top,
  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
