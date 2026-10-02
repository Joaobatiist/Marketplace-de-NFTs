import { expect, test } from './fixtures'
import { goToReview, logout } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.clock.install() // controla os 5 s do pagamento simulado
})

test('compra completa do catálogo ao recibo', async ({ page, app }) => {
  await app.open('/')
  await app.login('ana')
  await app.addToCart('nft_001')
  await app.visit('/cart')
  await page.getByRole('button', { name: 'Ir para pagamento' }).click()

  await page.getByRole('radio', { name: /Carteira principal/ }).check()
  await page.getByRole('radio', { name: 'Ethereum' }).check()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText(/Conectada/)).toBeVisible()
  await page.getByRole('button', { name: 'Revisar pedido' }).click()

  const confirm = page.getByRole('button', { name: 'Confirmar compra' })
  await expect(confirm).toBeEnabled()
  await confirm.dblclick() // clique repetido

  await expect(page.getByText(/Aguardando confirmação/)).toBeVisible()
  await page.clock.fastForward(6000)

  await expect(page).toHaveURL(/\/orders\//)
  await expect(page.getByText(/Pagamento confirmado|Pedido confirmado/)).toBeVisible()
  expect(await app.orderCount()).toBe(1)

  // os itens comprados saem do carrinho
  await app.visit('/cart')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('cliques repetidos em "Confirmar compra" geram um único pedido', async ({ page, app }) => {
  await app.open('/')
  await app.login('ana')
  await app.addToCart('nft_002')
  await goToReview(page)

  // 3 cliques no mesmo instante, antes de o React desabilitar o botão: os envios repetidos usam a mesma
  // Idempotency-Key (uma por cotação) e o servidor devolve o mesmo pedido
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Confirmar compra')!
    button.click()
    button.click()
    button.click()
  })

  await expect(page.getByText(/Aguardando confirmação/)).toBeVisible()
  await page.clock.fastForward(6000)
  await expect(page).toHaveURL(/\/orders\//)
  expect(await app.orderCount()).toBe(1)
})

test('payment-declined: pagamento recusado e itens continuam no carrinho', async ({ page, app }) => {
  await app.open('/', 'payment-declined')
  await app.login('ana')
  await app.addToCart('nft_004')
  await goToReview(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByText(/Aguardando confirmação/)).toBeVisible()
  await page.clock.fastForward(6000)
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
  await expect(page.getByText('Seus itens continuam no carrinho.')).toBeVisible()

  await page.getByRole('button', { name: 'Voltar ao carrinho' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await expect(page.getByRole('article', { name: /Wild Bloom #4/ })).toBeVisible()
  expect(await app.orderCount()).toBe(1)
})

test('order-timeout: resposta perdida, retry com a mesma chave e um único pedido', async ({ page, app }) => {
  await app.open('/', 'order-timeout')
  await app.login('ana')
  await app.addToCart('nft_005')
  await goToReview(page)
  test.setTimeout(60_000)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  // o pedido é criado na hora, mas o mock segura a 1ª resposta por 15 s
  await expect.poll(() => app.orderCount()).toBe(1)
  await expect(page.getByRole('button', { name: 'Enviando pedido…' })).toBeVisible()
  // o timeout do Axios (10 s) é o 	imeout nativo do XHR, fora do alcance do page.clock: espera real.
  // Depois dele, o retry (mesma Idempotency-Key) recupera o mesmo pedido.
  await expect(page.getByText(/Aguardando confirmação|Pagamento confirmado/)).toBeVisible({ timeout: 20_000 })
  await page.clock.fastForward(6000) // pagamento simulado, se ainda pendente
  await expect(page).toHaveURL(/\/orders\//)
  await expect(page.getByText('Pagamento confirmado')).toBeVisible()
  expect(await app.orderCount()).toBe(1)
})

test('F5 durante o pendente recupera o mesmo pedido', async ({ page, app }) => {
  await app.open('/')
  await app.login('ana')
  await app.addToCart('nft_006')
  await goToReview(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByText(/Aguardando confirmação/)).toBeVisible()

  await page.reload()
  await page.waitForFunction(() => '__mock' in window)
  await expect(page.getByText(/Aguardando confirmação|Verificando sua última tentativa/)).toBeVisible()
  await page.clock.fastForward(6000)
  await expect(page).toHaveURL(/\/orders\//)
  expect(await app.orderCount()).toBe(1)
})

test('wallet-rejected: erro de conexão com "Tentar novamente"', async ({ page, app }) => {
  await app.open('/', 'wallet-rejected')
  await app.login('ana')
  await app.addToCart('nft_008')
  await app.visit('/cart')
  await page.getByRole('button', { name: 'Ir para pagamento' }).click()
  await page.getByRole('radio', { name: /Carteira principal/ }).check()
  await page.getByRole('radio', { name: 'Ethereum' }).check()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()

  await expect(page.getByRole('alert').filter({ hasText: 'A conexão foi recusada na carteira.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Revisar pedido' })).toBeVisible()
})

test('recibo de outro usuário: "Pedido não encontrado"', async ({ page, app }, testInfo) => {
  await app.open('/')
  await app.login('ana')
  await app.addToCart('nft_009')
  await goToReview(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByText(/Aguardando confirmação/)).toBeVisible()
  await page.clock.fastForward(6000)
  await expect(page).toHaveURL(/\/orders\//)
  const receipt = new URL(page.url()).pathname

  await logout(page, testInfo)
  await app.login('bruno')
  await app.visit(receipt)
  await expect(page.getByRole('heading', { name: 'Pedido não encontrado' })).toBeVisible()
})
