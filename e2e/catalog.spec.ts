import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { isMobile, openFilters } from './helpers'

const cardNames = (page: Page) => page.locator('main article h3').allTextContents()
/** preço de vitrine de cada card ("1.21 ETH" → 1.21) */
const cardPrices = async (page: Page) =>
  (await page.locator('main article').allInnerTexts()).map((t) => Number(t.match(/([\d.]+) ETH/)?.[1]))

test('busca filtra o catálogo pelo termo', async ({ page, app }) => {
  await app.open('/')
  await page.getByRole('searchbox', { name: /Buscar NFTs por nome/ }).fill('golden')
  await expect(page).toHaveURL(/q=golden/)
  await expect.poll(async () => (await cardNames(page)).every((n) => /golden/i.test(n))).toBe(true)
  expect((await cardNames(page)).length).toBeGreaterThan(0)
})

test('filtros combinados: categoria + preço máximo + somente disponíveis', async ({ page, app }, testInfo) => {
  await app.open('/')
  const filters = await openFilters(page, testInfo)
  await filters.getByRole('radio', { name: 'Arte digital' }).check()
  await expect(page).toHaveURL(/category=digital_art/)
  await filters.getByLabel('Máximo').fill('2')
  await filters.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page).toHaveURL(/maxPrice=/)
  await filters.getByRole('switch', { name: 'Somente disponíveis' }).click()
  await expect(page).toHaveURL(/onlyAvailable=true/)
  if (isMobile(testInfo)) {
    await filters.getByRole('button', { name: 'Ver resultados' }).click()
    // fora do Sheet, o botão mostra quantos filtros estão ativos
    await expect(page.getByRole('button', { name: /^Filtros.*3 ativos/ })).toBeVisible()
  }

  await expect.poll(async () => (await cardNames(page)).length).toBeGreaterThan(0)
  const prices = await cardPrices(page)
  expect(prices.every((p) => p <= 2)).toBe(true)
  await expect(page.getByText('Esgotado', { exact: true })).toHaveCount(0)
})

test('ordenação por menor preço', async ({ page, app }) => {
  await app.open('/')
  await page.getByRole('combobox', { name: 'Ordenar por:' }).click()
  await page.getByRole('option', { name: 'Menor preço' }).click()
  await expect(page).toHaveURL(/sort=price_asc/)
  await expect.poll(async () => {
    const prices = await cardPrices(page)
    return prices.length > 1 && prices.every((p, i) => i === 0 || prices[i - 1] <= p)
  }).toBe(true)
})

test('paginação', async ({ page, app }) => {
  await app.open('/')
  const nav = page.getByRole('navigation', { name: 'Paginação' })
  await expect(nav.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
  await expect(nav.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
  const first = (await cardNames(page))[0]

  await nav.getByRole('button', { name: 'Próxima página' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(nav.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
  await expect.poll(async () => (await cardNames(page))[0]).not.toBe(first)

  await nav.getByRole('button', { name: 'Página 3' }).click()
  await expect(nav.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
})

test('mudar filtro volta para a página 1', async ({ page, app }) => {
  await app.open('/')
  await page.getByRole('navigation', { name: 'Paginação' }).getByRole('button', { name: 'Página 2' }).click()
  await expect(page).toHaveURL(/page=2/)
  await page.getByRole('combobox', { name: 'Ordenar por:' }).click()
  await page.getByRole('option', { name: 'Nome' }).click()
  await expect(page).toHaveURL(/sort=name/)
  await expect(page).toHaveURL(/page=1/)
})

test('voltar e avançar do navegador restauram o filtro', async ({ page, app }, testInfo) => {
  await app.open('/')
  const filters = await openFilters(page, testInfo)
  await filters.getByRole('radio', { name: 'Música' }).check()
  await expect(page).toHaveURL(/category=music/)
  if (isMobile(testInfo)) await page.keyboard.press('Escape')
  const musicNames = await cardNames(page)

  await page.goBack()
  await expect(page).not.toHaveURL(/category=/)
  await expect.poll(async () => (await cardNames(page)).join()).not.toBe(musicNames.join())

  await page.goForward()
  await expect(page).toHaveURL(/category=music/)
  await expect.poll(async () => (await cardNames(page)).join()).toBe(musicNames.join())
  if (!isMobile(testInfo)) await expect(page.getByRole('radio', { name: 'Música' })).toBeChecked()
})

test('refresh mantém busca e ordenação', async ({ page, app }) => {
  await app.open('/')
  await page.getByRole('searchbox', { name: /Buscar NFTs por nome/ }).fill('tiger')
  await expect(page).toHaveURL(/q=tiger/)
  await page.getByRole('combobox', { name: 'Ordenar por:' }).click()
  await page.getByRole('option', { name: 'Maior preço' }).click()
  await expect(page).toHaveURL(/sort=price_desc/)
  // espera a lista nova (o keepPreviousData mantém a anterior enquanto carrega)
  await expect.poll(async () => {
    const prices = await cardPrices(page)
    return prices.length > 1 && prices.every((p, i) => i === 0 || prices[i - 1] >= p)
  }).toBe(true)
  const before = await cardNames(page)

  await page.reload()
  await page.waitForFunction(() => '__mock' in window)
  await expect(page.getByRole('searchbox', { name: /Buscar NFTs por nome/ })).toHaveValue('tiger')
  await expect(page.getByRole('combobox', { name: 'Ordenar por:' })).toHaveText(/Maior preço/)
  await expect.poll(async () => (await cardNames(page)).join()).toBe(before.join())
})
