import type { Page, TestInfo } from '@playwright/test'
import { expect, test } from './fixtures'
import { isMobile } from './helpers'

/** menu principal: no desktop fica no header; no mobile abre o menu lateral */
async function mainNav(page: Page, testInfo: TestInfo) {
  if (!isMobile(testInfo)) return page.getByRole('navigation', { name: 'Principal', exact: true })
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  return page.getByRole('navigation', { name: 'Principal (mobile)' })
}

for (const [label, path, heading] of [
  ['Mercado', '/market', 'Mercado'],
  ['Criadores', '/creators', 'Criadores'],
  ['Aprenda', '/learn', 'Aprenda'],
] as const) {
  test(`menu principal: ${label} abre a seção e fica marcado`, async ({ page, app }, testInfo) => {
    await app.open('/')
    await (await mainNav(page, testInfo)).getByRole('link', { name: label }).click()
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()

    const nav = await mainNav(page, testInfo)
    await expect(nav.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page')
    await expect(nav.getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current', 'page')
    await expect(nav.getByText('Em breve')).toHaveCount(0)
  })
}

test('mercado: números do catálogo e coleção leva ao catálogo filtrado', async ({ page, app }) => {
  await app.open('/market')
  const stats = page.locator('dl').first()
  await expect(stats.getByText('NFTs listados').locator('..')).toContainText('30')
  await expect(stats.getByText('Coleções').locator('..')).toContainText('5')

  await expect(page.getByRole('article', { name: 'Neon Apes' })).toContainText('Itens6')
  await page.getByRole('link', { name: /^Neon Apes\s*, ver no catálogo$/ }).click()
  await expect(page).toHaveURL(/\/\?.*q=Neon(\+|%20)Apes/)
  await expect(page.getByRole('searchbox', { name: /Buscar NFTs por nome/ })).toHaveValue('Neon Apes')
})

test('mercado: preço mínimo atualiza em tempo real', async ({ page, app }) => {
  await app.open('/market')
  const floor = page.getByText('Preço mínimo').locator('..')
  await expect(floor).not.toContainText('0.001 ETH')
  await app.updateEdition('nft_001', 'nft_001_std', { price: '0.001' })
  await expect(floor).toContainText('0.001 ETH')
})

test('criadores: card do artista e "Ver obras" filtra o catálogo', async ({ page, app }) => {
  await app.open('/creators')
  const card = page.getByRole('article', { name: 'Artista 1' })
  await expect(card).toContainText('8 obras · 5 coleções')
  await expect(card.getByRole('listitem')).toHaveCount(3)

  await card.getByRole('link', { name: 'Ver obras de Artista 1' }).click()
  await expect(page).toHaveURL(/q=Artista(\+|%20)1/)
  await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
})

test('aprenda: abrir artigo mantém "Aprenda" marcado; slug inválido mostra erro', async ({ page, app }, testInfo) => {
  await app.open('/learn')
  await page.getByRole('link', { name: 'Como proteger sua carteira' }).click()
  await expect(page).toHaveURL(/\/learn\/como-proteger-sua-carteira$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Como proteger sua carteira' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Continue aprendendo' })).toBeVisible()

  const nav = await mainNav(page, testInfo)
  await expect(nav.getByRole('link', { name: 'Aprenda' })).toHaveAttribute('data-status', 'active')
  if (isMobile(testInfo)) await page.keyboard.press('Escape')

  await app.visit('/learn/nao-existe')
  await expect(page.getByRole('heading', { name: 'Artigo não encontrado' })).toBeVisible()
  await page.getByRole('button', { name: 'Ver todos os artigos' }).click()
  await expect(page).toHaveURL(/\/learn$/)
})

test('rodapé: "Como comprar NFTs" abre o guia', async ({ page, app }) => {
  await app.open('/')
  await page.getByRole('navigation', { name: 'Rodapé' }).getByRole('link', { name: 'Como comprar NFTs' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Como comprar seu primeiro NFT' })).toBeVisible()
})
