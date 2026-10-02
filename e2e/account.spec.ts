import { expect, test } from './fixtures'
import { logout } from './helpers'

test('editar nome e e-mail persiste após refresh', async ({ page, app }) => {
  await app.open('/')
  await app.login('ana')
  await app.visit('/profile')
  await page.getByLabel('Nome de exibição').fill('Ana Clara')
  await page.getByLabel('E-mail').fill('ana.clara@teste.com')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Dados atualizados')).toBeVisible()

  await page.reload()
  await page.waitForFunction(() => '__mock' in window)
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Clara')
  await expect(page.getByLabel('E-mail')).toHaveValue('ana.clara@teste.com')
})

test('e-mail já usado por outro usuário: erro no campo', async ({ page, app }) => {
  await app.open('/')
  await app.login('ana')
  await app.visit('/profile')
  await page.getByLabel('E-mail').fill('bruno@teste.com')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByLabel('E-mail')).toHaveAccessibleDescription('Este e-mail já está em uso.')
})

test('avatar: upload e remoção', async ({ page, app }) => {
  await app.open('/')
  await app.login('ana')
  await app.visit('/profile')
  await page.getByLabel('Alterar foto').setInputFiles('e2e/fixtures/avatar.png')
  await expect(page.getByText('Foto atualizada')).toBeVisible()
  await expect(page.getByRole('img', { name: 'Foto de Ana Souza' })).toBeVisible()

  await page.getByRole('button', { name: 'Remover foto' }).click()
  await expect(page.getByText('Foto removida')).toBeVisible()
  await expect(page.getByRole('img', { name: /Sem foto/ })).toBeVisible()
})

test('troca de senha: senha atual errada e depois certa', async ({ page, app }, testInfo) => {
  await app.open('/')
  await app.login('ana')
  await app.visit('/profile')
  const current = page.getByLabel('Senha atual')
  await current.fill('errada123')
  await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha@1')
  await page.getByLabel('Confirmar nova senha').fill('NovaSenha@1')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(current).toHaveAccessibleDescription('Senha atual incorreta.')

  await current.fill('Senha@123')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Senha alterada')).toBeVisible()
  await expect(current).toHaveValue('')

  await logout(page, testInfo)
  await app.visit('/login')
  await page.getByLabel('E-mail').fill('ana@teste.com')
  await page.getByLabel('Senha').fill('NovaSenha@1')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).not.toHaveURL(/\/login/)
})

test('carteiras: cadastrar, endereço inválido, endereço repetido e editar', async ({ page, app }) => {
  await app.open('/')
  await app.login('bruno')
  await app.visit('/wallets')
  const primary = page.getByRole('region', { name: 'Carteira principal' })
  const secondary = page.getByRole('region', { name: 'Carteira secundária' })
  await expect(primary).toContainText('Você ainda não adicionou uma carteira principal.')

  await primary.getByRole('button', { name: 'Adicionar' }).click()
  await expect(primary.getByLabel('Apelido da carteira')).toBeFocused()
  await primary.getByLabel('Apelido da carteira').fill('Principal do Bruno')
  await primary.getByLabel('Rede').selectOption('ethereum')
  await primary.getByLabel('Tipo de carteira').selectOption('metamask')
  await primary.getByLabel('Endereço da carteira').fill('0x123')
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(primary.getByLabel('Endereço da carteira')).toHaveAccessibleDescription(/Endereço inválido/)

  await primary.getByLabel('Endereço da carteira').fill(`0x${'b'.repeat(40)}`)
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira cadastrada', { exact: true })).toBeVisible()

  // secundária "igual à principal": copia os dados, mas o endereço repetido é recusado pelo servidor
  await secondary.getByLabel('Igual à carteira principal').check()
  await secondary.getByRole('button', { name: 'Adicionar' }).click()
  await expect(secondary.getByLabel('Apelido da carteira')).toHaveValue('Principal do Bruno')
  await secondary.getByLabel('Endereço da carteira').fill(`0x${'b'.repeat(40)}`)
  await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(secondary.getByLabel('Endereço da carteira')).toHaveAccessibleDescription('Este endereço já está cadastrado.')

  // editar a principal
  await primary.getByLabel('Apelido da carteira').fill('Carteira Bruno')
  await primary.getByLabel('Rede').selectOption('polygon')
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira atualizada', { exact: true })).toBeVisible()
  await page.reload()
  await expect(primary.getByLabel('Apelido da carteira')).toHaveValue('Carteira Bruno')
  await expect(primary.getByLabel('Rede')).toHaveValue('polygon')
})
