import type { Page } from '@playwright/test'
import { expect, test, USERS } from './fixtures'
import { apiFromPage, isMobile, logout } from './helpers'

/** logado: no desktop o menu da conta; no mobile o link "Perfil" da barra inferior */
async function expectLoggedIn(page: Page, mobile: boolean, firstName: string) {
  if (mobile) await expect(page.getByRole('navigation', { name: 'Navegação inferior' }).getByRole('link', { name: 'Perfil' })).toBeVisible()
  else await expect(page.getByRole('button', { name: new RegExp(`${firstName}.*menu da conta`) })).toBeVisible()
}

async function fillLogin(page: Page, user: keyof typeof USERS) {
  await page.getByLabel('E-mail').fill(USERS[user].email)
  await page.getByLabel('Senha').fill(USERS[user].password)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

test('cadastro com sucesso', async ({ page, app }, testInfo) => {
  await app.open('/register')
  await page.getByLabel('Nome').fill('Carla Dias')
  await page.getByLabel('E-mail').fill('carla@teste.com')
  await page.getByLabel('Senha', { exact: true }).fill('Senha@123')
  await page.getByLabel('Confirmar senha').fill('Senha@123')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page).not.toHaveURL(/\/register/)
  await expectLoggedIn(page, isMobile(testInfo), 'Carla')
})

test('cadastro com e-mail existente: conflito no campo', async ({ page, app }) => {
  await app.open('/register')
  await page.getByLabel('Nome').fill('Outra Ana')
  await page.getByLabel('E-mail').fill(USERS.ana.email)
  await page.getByLabel('Senha', { exact: true }).fill('Senha@123')
  await page.getByLabel('Confirmar senha').fill('Senha@123')
  await page.getByRole('button', { name: 'Criar conta' }).click()

  const email = page.getByLabel('E-mail')
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toHaveAccessibleDescription('Este e-mail já está cadastrado.')
})

test('validação do formulário de cadastro', async ({ page, app }) => {
  await app.open('/register')
  await page.getByLabel('Senha', { exact: true }).fill('123')
  await page.getByLabel('Confirmar senha').fill('456')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByLabel('Nome')).toHaveAccessibleDescription('Informe seu nome')
  await expect(page.getByLabel('E-mail')).toHaveAccessibleDescription('Informe o e-mail')
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAccessibleDescription('A senha deve ter pelo menos 8 caracteres')
  await expect(page.getByLabel('Confirmar senha')).toHaveAccessibleDescription('As senhas não coincidem')
})

test('login', async ({ page, app }, testInfo) => {
  await app.open('/')
  await app.login('ana')
  await expectLoggedIn(page, isMobile(testInfo), 'Ana')
})

test('rota protegida redireciona para o login e volta', async ({ page, app }) => {
  await app.open('/profile')
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await fillLogin(page, 'ana')
  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
})

test('sessão expirada durante a navegação: vai ao login e volta', async ({ page, app }) => {
  await app.open('/')
  await app.login('ana')
  await app.visit('/profile')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()

  expect(await apiFromPage(page, 'POST', '/api/__dev/expire-sessions')).toBe(204)
  await page.getByRole('navigation', { name: 'Minha conta' }).getByRole('link', { name: 'Carteiras' }).click()

  await expect(page).toHaveURL(/\/login\?redirect=.*wallets/)
  await fillLogin(page, 'ana')
  await expect(page).toHaveURL(/\/wallets$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Carteiras' })).toBeVisible()
})

test('sessão expirada durante o checkout: preserva o retorno', async ({ page, app }) => {
  await app.open('/')
  await app.login('ana')
  await app.addToCart('nft_001')
  await app.visit('/cart')
  await page.getByRole('button', { name: 'Ir para pagamento' }).click()
  await page.getByRole('radio', { name: /Carteira principal/ }).check()
  await page.getByRole('radio', { name: 'Ethereum' }).check()

  expect(await apiFromPage(page, 'POST', '/api/__dev/expire-sessions')).toBe(204)
  await page.getByRole('button', { name: 'Conectar carteira' }).click()

  await expect(page).toHaveURL(/\/login\?redirect=.*checkout/)
  await fillLogin(page, 'ana')
  await expect(page).toHaveURL(/\/checkout$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Pagamento' })).toBeVisible()
})

test('logout', async ({ page, app }, testInfo) => {
  await app.open('/')
  await app.login('ana')
  await logout(page, testInfo)
  await app.visit('/profile')
  await expect(page).toHaveURL(/\/login\?redirect=/)
})

test('troca de usuário Ana → Bruno sem vazar favoritos, carrinho ou pedidos', async ({ page, app }, testInfo) => {
  await page.clock.install()
  await app.open('/')
  await app.login('ana')
  // Ana: favorito, item no carrinho e um pedido confirmado
  await app.visit('/nfts/nft_001')
  await page.getByRole('button', { name: 'Favoritar Cosmic Tiger #1' }).click()
  await expect(page.getByRole('button', { name: 'Favoritar Cosmic Tiger #1' })).toHaveAttribute('aria-pressed', 'true')
  await app.addToCart('nft_002')
  await app.visit('/cart')
  await page.getByRole('button', { name: 'Ir para pagamento' }).click()
  await page.getByRole('radio', { name: /Carteira principal/ }).check()
  await page.getByRole('radio', { name: 'Ethereum' }).check()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText(/Conectada/)).toBeVisible()
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByText(/Aguardando confirmação/)).toBeVisible()
  await page.clock.fastForward(6000)
  await expect(page).toHaveURL(/\/orders\//)
  const anaOrder = new URL(page.url()).pathname
  await app.addToCart('nft_004')

  await logout(page, testInfo)
  await app.login('bruno')

  await app.visit('/nfts/nft_001')
  await expect(page.getByRole('button', { name: 'Favoritar Cosmic Tiger #1' })).toHaveAttribute('aria-pressed', 'false')
  await app.visit('/cart')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  await app.visit(anaOrder)
  await expect(page.getByRole('heading', { name: 'Pedido não encontrado' })).toBeVisible()
})
