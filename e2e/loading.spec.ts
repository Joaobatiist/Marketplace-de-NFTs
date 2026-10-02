import { expect, test } from './fixtures'

test('slow: skeletons no catálogo, no detalhe e no resumo do carrinho', async ({ page, app }) => {
  test.setTimeout(60_000)
  await app.open('/', 'slow')
  await expect(page.getByRole('status').filter({ hasText: 'Carregando NFTs' })).toBeVisible()
  await expect(page.locator('main article').first()).toBeVisible({ timeout: 15_000 })

  await page.locator('main article a').first().click()
  await expect(page.getByRole('status').filter({ hasText: 'Carregando NFT' })).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click({ timeout: 15_000 })
  await expect(page.getByText('Adicionado ao carrinho')).toBeVisible({ timeout: 15_000 })

  await app.visit('/cart')
  await expect(page.getByRole('status').filter({ hasText: 'Calculando valores' })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Ir para pagamento' })).toBeEnabled({ timeout: 15_000 })
})

test('server-error: mensagem de falha e "Tentar novamente" recupera após trocar o cenário', async ({ page, app }) => {
  await app.open('/', 'server-error')
  await expect(page.getByRole('alert').filter({ hasText: 'Serviço temporariamente indisponível' })).toBeVisible()

  await page.evaluate(() => (window as any).__mock.scenario.applyPreset('fast'))
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.locator('main article').first()).toBeVisible()
})
