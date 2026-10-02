import { expect, test } from './fixtures'
import { goToReview } from './helpers'

test('mudança de preço via Socket.IO bloqueia o checkout', async ({ page, app }) => {
  await app.open('/')
  await app.login('ana')
  await app.addToCart('nft_001')
  await app.visit('/cart')
  await expect(page.getByRole('button', { name: 'Ir para pagamento' })).toBeEnabled()

  await app.updateEdition('nft_001', 'nft_001_std', { price: '9.999' })

  await expect(page.getByRole('alert').filter({ hasText: /preço mudou/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ir para pagamento' })).toBeDisabled()

  await page.getByRole('button', { name: 'Atualizar carrinho' }).click()
  await expect(page.getByRole('button', { name: 'Ir para pagamento' })).toBeEnabled()
})

test('ignora evento duplicado e evento antigo', async ({ page, app }) => {
  await app.open('/nfts/nft_001')
  await app.updateEdition('nft_001', 'nft_001_std', { price: '1.500' })
  await expect(page.getByText('1.5 ETH').first()).toBeVisible()

  // evento antigo (versão 1) tentando voltar o preço
  await page.evaluate(() =>
    (window as any).__mock.emitRaw('nft.updated', {
      eventId: 'stale-1', type: 'nft.updated', resourceId: 'nft_001', version: 1,
      occurredAt: new Date().toISOString(),
      payload: { editions: [{ editionId: 'nft_001_std', price: '0.001', available: 50 }] },
    }),
  )
  await expect(page.getByText('1.5 ETH').first()).toBeVisible()
  await expect(page.getByText('0.001 ETH')).toHaveCount(0)
})

test('evento duplicado (mesmo eventId) é aplicado uma vez só', async ({ page, app }) => {
  await app.open('/')
  await app.login('ana')
  await app.addToCart('nft_001')
  await app.visit('/cart')
  await expect(page.getByRole('button', { name: 'Ir para pagamento' })).toBeEnabled()

  const event = {
    eventId: 'dup-1', type: 'nft.updated', resourceId: 'nft_001', version: 900,
    occurredAt: new Date().toISOString(),
    payload: { editions: [{ editionId: 'nft_001_std', price: '7.777', available: 40 }] },
  }
  await page.evaluate((e) => {
    const mock = (window as any).__mock
    mock.emitRaw('nft.updated', e)
    mock.emitRaw('nft.updated', e)
  }, event)

  const toast = page.getByText('Cosmic Tiger #1: preço ou disponibilidade mudou. Revise seu carrinho.')
  await expect(toast).toHaveCount(1)
  await page.waitForTimeout(1000) // tempo para um eventual 2º toast aparecer
  await expect(toast).toHaveCount(1)
})

test('preço alterado durante a revisão do checkout bloqueia a confirmação', async ({ page, app }) => {
  await app.open('/')
  await app.login('ana')
  await app.addToCart('nft_001')
  await goToReview(page)

  await app.updateEdition('nft_001', 'nft_001_std', { price: '9.999' })

  await expect(page.getByRole('alert').filter({ hasText: /preço mudou/i })).toBeVisible()
  await expect(page.getByRole('table').getByText('9.999 ETH').filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled()
})

test('queda do tempo real mostra o banner e reconcilia com a API ao reconectar', async ({ page, app }) => {
  await app.open('/')
  await app.login('ana')
  await app.addToCart('nft_001')
  await app.visit('/cart')
  await expect(page.getByRole('button', { name: 'Ir para pagamento' })).toBeEnabled()

  await page.evaluate(() => (window as any).__mock.dropAllConnections())
  const banner = page.getByText('Conexão em tempo real perdida. Reconectando…')
  await expect(banner).toBeVisible()

  // muda o preço enquanto não há conexão: o evento se perde e só a reconciliação REST traz a mudança
  await app.updateEdition('nft_001', 'nft_001_std', { price: '9.999' })

  await expect(banner).toBeHidden({ timeout: 15_000 })
  await expect(page.getByRole('alert').filter({ hasText: /preço mudou/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ir para pagamento' })).toBeDisabled()
})

test('queda do tempo real com pedido pendente termina em 1 pedido confirmado', async ({ page, app }) => {
  await page.clock.install()
  await app.open('/')
  await app.login('ana')
  await app.addToCart('nft_002')
  await goToReview(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByText(/Aguardando confirmação/)).toBeVisible()

  await page.evaluate(() => (window as any).__mock.dropAllConnections())
  await page.clock.fastForward(6000)

  await expect(page).toHaveURL(/\/orders\//)
  await expect(page.getByText('Pagamento confirmado')).toBeVisible()
  expect(await app.orderCount()).toBe(1)
})
