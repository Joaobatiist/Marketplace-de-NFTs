import type { Page, TestInfo } from '@playwright/test'
import { expect, test } from './fixtures'
import { isMobile } from './helpers'

const cartLink = (page: Page, testInfo: TestInfo) =>
  (isMobile(testInfo) ? page.getByRole('navigation', { name: 'Navegação inferior' }) : page.getByRole('banner')).getByRole('link', {
    name: /^Carrinho/,
  })
const total = (page: Page) => page.locator('[aria-live="polite"]').filter({ hasText: 'Total' })

test('adicionar, alterar quantidade e remover', async ({ page, app }, testInfo) => {
  await app.open('/')
  await app.addToCart('nft_001')
  await app.addToCart('nft_002')
  await expect(cartLink(page, testInfo)).toHaveAccessibleName('Carrinho, 2 itens')

  await app.visit('/cart')
  await expect(page.getByRole('article')).toHaveCount(2)
  const before = await total(page).innerText()

  await page.getByRole('button', { name: 'Aumentar quantidade de Cosmic Tiger #1' }).click()
  await expect(page.getByLabel('Qtd. de Cosmic Tiger #1')).toHaveValue('2')
  await expect(total(page)).not.toHaveText(before)
  await expect(cartLink(page, testInfo)).toHaveAccessibleName('Carrinho, 3 itens')

  await page.getByRole('button', { name: 'Remover Silent Mask #2' }).click()
  await expect(page.getByText('Silent Mask #2 removido do carrinho')).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(1)

  await page.getByRole('button', { name: 'Remover Cosmic Tiger #1' }).click()
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('cupons: JUNGLE10 aplica e persiste; ABC inválido; EXPIRADO expirado', async ({ page, app }) => {
  await app.open('/')
  await app.addToCart('nft_001')
  await app.visit('/cart')
  const code = page.getByLabel('Código promocional')

  await code.fill('ABC')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(code).toHaveAttribute('aria-invalid', 'true')
  await expect(code).toHaveAccessibleDescription('Cupom inválido.')

  await code.fill('EXPIRADO')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(code).toHaveAccessibleDescription('Este cupom expirou.')

  await code.fill('JUNGLE10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByText('Cupom aplicado')).toBeVisible()
  await expect(page.getByText('Desconto (JUNGLE10)')).toBeVisible()

  await page.reload()
  await page.waitForFunction(() => '__mock' in window)
  await expect(page.getByRole('button', { name: 'Remover cupom' })).toBeVisible()
  await expect(page.getByText('Desconto (JUNGLE10)')).toBeVisible()
})

test('carrinho de visitante é mesclado no login', async ({ page, app }) => {
  await app.open('/')
  await app.addToCart('nft_001')
  await app.addToCart('nft_005')
  await app.login('ana')
  await app.visit('/cart')
  await expect(page.getByRole('article', { name: /Cosmic Tiger #1/ })).toBeVisible()
  await expect(page.getByRole('article', { name: /Golden Orbit #5|#5/ })).toBeVisible()
})

test('carrinho persiste após refresh', async ({ page, app }, testInfo) => {
  await app.open('/')
  await app.addToCart('nft_003')
  await app.visit('/cart')
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.reload()
  await page.waitForFunction(() => '__mock' in window)
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(cartLink(page, testInfo)).toHaveAccessibleName('Carrinho, 1 item')
})
