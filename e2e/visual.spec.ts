import { expect, test } from './fixtures'

// As baselines são geradas em Linux, no container oficial do Playwright (npm run test:e2e:docker:update).
// A renderização de fonte muda entre sistemas (no Windows, 2–6% dos pixels e até a altura da página),
// então fora do Linux estes testes são pulados — rode `npm run test:e2e:docker` para executá-los.
test.skip(process.platform !== 'linux', 'regressão visual roda em Linux: use npm run test:e2e:docker')

const pages = [
  { name: 'home', path: '/' },
  { name: 'detail', path: '/nfts/nft_001' },
] as const

for (const { name, path } of pages) {
  test(`visual: ${name}`, async ({ page, app }) => {
    await app.open(path)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true })
  })
}

test('visual: cart', async ({ page, app }) => {
  await app.open('/')
  await app.login('ana')
  await app.addToCart('nft_001')
  await app.visit('/cart')
  await expect(page.getByRole('button', { name: 'Ir para pagamento' })).toBeEnabled()
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('cart.png', { fullPage: true })
})

test('visual: checkout', async ({ page, app }) => {
  await app.open('/')
  await app.login('ana')
  await app.addToCart('nft_001')
  await app.visit('/checkout')
  // etapa de detalhes, antes de conectar a carteira
  await expect(page.getByRole('button', { name: 'Conectar carteira' })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('checkout.png', { fullPage: true })
})
