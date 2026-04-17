export default defineNuxtConfig({
  devtools: { enabled: false },

  experimental: { appManifest: false },

  ssr: false,

  runtimeConfig: {
    public: {
      apiOrigin: process.env.JARDILOCK_PUBLIC_API_ORIGIN || 'http://127.0.0.1:3001'
    }
  },

  css: [
    '~/assets/css/main.css',
    'leaflet/dist/leaflet.css',
    'leaflet.markercluster/dist/MarkerCluster.css',
    '@vuepic/vue-datepicker/dist/main.css'
  ],

  app: {
    head: {
      title: 'JardiLock — Location de jardins privés',
      htmlAttrs: { lang: 'fr' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Louez des jardins privés pour vos événements : mariages, anniversaires, barbecues et plus.' },
        { name: 'theme-color', content: '#e12c42' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap' }
      ]
    }
  },

  build: {
    transpile: ['@vuepic/vue-datepicker']
  },

  compatibilityDate: '2025-01-01'
})
