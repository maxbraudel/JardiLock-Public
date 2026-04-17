<script setup lang="ts">
import listingExampleImage from '~/assets/images/illustrations/annonce.jpg'

useSeoMeta({
  title: 'JardiLock | Catalogue de location de jardins',
  description: 'Trouvez simplement un jardin à louer pour un moment au vert, un repas ou une petite célébration.'
})

const landingBenefits = [
  'Des jardins privés sélectionnés pour des usages simples et conviviaux.',
  'Une recherche claire pour trouver rapidement un lieu adapté.',
  'Des annonces pensées pour réserver sans complexité inutile.'
]

const exampleHighlights = [
  '12 personnes',
  'Terrasse ombragée',
  'Quartier calme'
]
</script>

<template>
  <div class="landing-page">
    <div class="container">
      <div class="landing-shell">
        <section class="hero-section">
          <div class="hero-copy">
            <UiBadge tone="muted" size="md">Catalogue de location de jardins</UiBadge>
            <h1 class="hero-title">Louez un jardin simplement pour profiter d'un vrai moment dehors.</h1>
            <p class="hero-text">
              JardiLock rassemble des jardins privés à louer pour un anniversaire, un repas au soleil
              ou une journée au calme. Une seule destination, un catalogue clair, et rien de plus.
            </p>

            <NuxtLink to="/gardens" class="hero-cta-link">
              <UiButton size="lg">Accéder au catalogue</UiButton>
            </NuxtLink>
          </div>

          <aside class="hero-preview" aria-label="Exemple d'annonce">
            <article class="example-card">
              <div class="example-card-visual">
                <img class="example-card-photo" :src="listingExampleImage" alt="Exemple d'annonce de jardin sur JardiLock">
                <span class="example-card-price">65 EUR / jour</span>
              </div>

              <div class="example-card-body">
                <p class="example-card-kicker">Exemple d'annonce</p>
                <h2 class="example-card-title">Jardin arboré pour repas d'été et après-midi au vert</h2>
                <p class="example-card-text">Toulouse et alentours, dans un cadre calme et facile d'accès.</p>

                <div class="example-card-tags">
                  <UiTag v-for="highlight in exampleHighlights" :key="highlight" icon="check">
                    {{ highlight }}
                  </UiTag>
                </div>
              </div>
            </article>
          </aside>
        </section>

        <section class="benefits-section" aria-label="Pourquoi JardiLock">
          <article v-for="benefit in landingBenefits" :key="benefit" class="benefit-card">
            <p>{{ benefit }}</p>
          </article>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.landing-page {
  min-height: calc(100vh - var(--header-height));
  padding: clamp(2.5rem, 5vw, 5rem) 0 0;
  background:
    radial-gradient(circle at top left, rgba(248, 187, 134, 0.28), transparent 28%),
    radial-gradient(circle at right 15%, rgba(225, 44, 66, 0.08), transparent 24%),
    linear-gradient(180deg, #fffdfb 0%, #ffffff 48%, #fbfbf9 100%);
}

.landing-shell {
  width: min(100%, 980px);
  margin: 0 auto;
}

.hero-section {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: clamp(1.5rem, 4vw, 3rem);
  align-items: center;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-5);
}

.hero-title {
  max-width: 12ch;
  font-size: clamp(2.6rem, 5vw, 4.4rem);
  line-height: 0.96;
  letter-spacing: -0.04em;
}

.hero-text {
  max-width: 34rem;
  font-size: 1.02rem;
  color: var(--color-text-light);
}

.hero-cta-link {
  display: inline-flex;
}

.hero-preview {
  min-width: 0;
}

.example-card {
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 24px 60px rgba(27, 27, 27, 0.08);
  backdrop-filter: blur(8px);
}

.example-card-visual {
  position: relative;
  padding: var(--space-4);
}

.example-card-photo {
  aspect-ratio: 4 / 3;
  width: 100%;
  border-radius: 20px;
  object-fit: cover;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.example-card-price {
  position: absolute;
  right: calc(var(--space-4) + 0.5rem);
  bottom: calc(var(--space-4) + 0.5rem);
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: var(--font-weight-bold);
  box-shadow: var(--shadow-sm);
}

.example-card-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: 0 var(--space-4) var(--space-4);
}

.example-card-kicker {
  font-size: 0.78rem;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.example-card-title {
  font-size: 1.35rem;
  line-height: 1.08;
}

.example-card-text {
  color: var(--color-text-light);
}

.example-card-tags {
  display: grid;
  gap: 0.6rem;
}

.benefits-section {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
  margin-top: clamp(2.5rem, 5vw, 4rem);
}

.benefit-card {
  padding: 1.1rem 1.15rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--color-text-light);
  box-shadow: 0 12px 32px rgba(27, 27, 27, 0.04);
}

@media (max-width: 900px) {
  .hero-section {
    grid-template-columns: 1fr;
  }

  .hero-title,
  .hero-text {
    max-width: none;
  }

  .hero-preview {
    max-width: 34rem;
  }

  .benefits-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .landing-page {
    padding-top: var(--space-8);
  }

  .hero-copy {
    gap: var(--space-4);
  }

  .hero-title {
    font-size: clamp(2.2rem, 10vw, 3.4rem);
  }

  .hero-preview {
    margin: 0 auto;
  }

  .example-card {
    border-radius: 24px;
  }

  .example-card-visual,
  .example-card-body {
    padding-left: var(--space-3);
    padding-right: var(--space-3);
  }

  .example-card-visual {
    padding-top: var(--space-3);
  }

  .example-card-body {
    padding-bottom: var(--space-3);
  }
}
</style>