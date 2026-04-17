import { expect, test, type Page } from '@playwright/test'

const mockedListings = [
  {
    id: 'listing-smoke-1',
    title: 'Jardin smoke de demonstration',
    slug: 'jardin-smoke',
    price_cents: 18000,
    currency: 'EUR',
    address: '12 Rue de Test, 75001 Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    address_city_insee_code: '75056',
    address_department_code: '75',
    address_region_code: '11',
    address_country_code: 'FR',
    address_street_number: '12',
    address_street_label: 'Rue de Test',
    address_postal_code: '75001',
    area_m2: 400,
    capacity: 30,
    animals_allowed: true,
    thumbnail: null,
    author: {
      id: 1,
      display_name: 'Hote smoke'
    },
    tags: {
      equipment: ['Piscine'],
      event: ['Anniversaire']
    },
    effective_schedule: Array.from({ length: 7 }, (_, day) => ({
      day_of_week: day,
      is_open: day < 5,
      hours: day < 5
        ? [{ LDT_open_time: '09:00', LDT_close_time: '18:00' }]
        : []
    })),
    exclude_public_holidays: false,
    UTC_created_at: '2026-03-01T12:00:00.000Z'
  },
  {
    id: 'listing-smoke-2',
    title: 'Jardin smoke secondaire',
    slug: 'jardin-smoke-secondaire',
    price_cents: 22000,
    currency: 'EUR',
    address: '24 Avenue du Test, 69001 Lyon',
    latitude: 45.764,
    longitude: 4.8357,
    address_city_insee_code: '69123',
    address_department_code: '69',
    address_region_code: '84',
    address_country_code: 'FR',
    address_street_number: '24',
    address_street_label: 'Avenue du Test',
    address_postal_code: '69001',
    area_m2: 260,
    capacity: 18,
    animals_allowed: false,
    thumbnail: null,
    author: {
      id: 2,
      display_name: 'Hote smoke 2'
    },
    tags: {
      equipment: ['Barbecue'],
      event: ['Brunch']
    },
    effective_schedule: Array.from({ length: 7 }, (_, day) => ({
      day_of_week: day,
      is_open: day !== 0,
      hours: day !== 0
        ? [{ LDT_open_time: '10:00', LDT_close_time: '19:00' }]
        : []
    })),
    exclude_public_holidays: false,
    UTC_created_at: '2026-03-02T12:00:00.000Z'
  }
] as const

const mockedListing = mockedListings[0]

const mockedListingDetail = {
  ...mockedListing,
  description: 'Description smoke detaillee pour l\'overlay.',
  timezone: 'Europe/Paris',
  water_point: true,
  night_lighting: false,
  wheelchair_accessible: true,
  deposit_cents: 5000,
  cancellation_policy: 'Annulation gratuite jusqu\'a 48h avant.',
  created_at: '2026-03-01T12:00:00.000Z',
  images: [],
  availability: null
}

const mockedListingDetailsBySlug = {
  [mockedListings[0].slug]: mockedListingDetail,
  [mockedListings[1].slug]: {
    ...mockedListings[1],
    description: 'Description smoke secondaire.',
    timezone: 'Europe/Paris',
    water_point: false,
    night_lighting: true,
    wheelchair_accessible: false,
    deposit_cents: 3000,
    cancellation_policy: 'Annulation standard.',
    created_at: '2026-03-02T12:00:00.000Z',
    images: [],
    availability: null
  }
} as const

async function mockCatalogApi(page: Page) {
  await page.route('**/api/locations/suggest?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    })
  })

  await page.route('**/api/listings/availability-by-date?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        date: '2099-01-01',
        availabilities: {}
      })
    })
  })

  await page.route('**/api/listings/*', async (route) => {
    const url = new URL(route.request().url())
    const slug = url.pathname.split('/').pop() || ''
    const listingDetail = mockedListingDetailsBySlug[slug as keyof typeof mockedListingDetailsBySlug]

    await route.fulfill({
      status: listingDetail ? 200 : 404,
      contentType: 'application/json',
      body: JSON.stringify(listingDetail ?? { message: 'Not found' })
    })
  })

  await page.route('**/api/listings', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockedListings)
    })
  })
}

test.beforeEach(async ({ page }) => {
  await mockCatalogApi(page)
})

test('renders the gardens catalog shell with mocked results', async ({ page }) => {
  await page.goto('/gardens')

  await expect(page.getByRole('button', { name: 'Prix' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Superficie' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Filtres/i }).first()).toBeVisible()
  await expect(page.getByText('2 annonces')).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: mockedListing.title })).toBeVisible()
})

test('likes only the clicked listing card', async ({ page }) => {
  await page.goto('/gardens')

  await expect(page.getByRole('button', { name: 'Ajouter aux favoris' })).toHaveCount(2)

  await page.getByRole('button', { name: 'Ajouter aux favoris' }).nth(0).click()

  await expect(page.getByRole('button', { name: 'Retirer des favoris' })).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Ajouter aux favoris' })).toHaveCount(1)
})

test('opens the listing overlay from the hash route', async ({ page }) => {
  await page.goto(`/gardens#listing=${mockedListing.slug}`)

  await expect(page.getByText(mockedListingDetail.description)).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Description' })).toBeVisible()
})

test('redirects slug routes to the catalog hash overlay route', async ({ page }) => {
  await page.goto(`/gardens/${mockedListing.slug}`)

  await page.waitForURL(`**/gardens#listing=${mockedListing.slug}`)
  await expect(page).toHaveURL(new RegExp(`/gardens#listing=${mockedListing.slug}$`))
})