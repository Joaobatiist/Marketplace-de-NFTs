import { expect, test } from './fixtures'
import { logout } from './helpers'

test('editar nome e e-mail persiste após refresh', async ({ page, app }) => {
  await app.open('/')
  await app.login('ana')
  await app.visit('/profile')
  await page.getByLabel('Nome de exibição').fill('Ana Clara')
  await page.getByLabel('E-mail').fill('ana.clara@teste.com')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
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
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
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
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()
  await expect(current).toHaveAccessibleDescription('Senha atual incorreta.')

  await current.fill('Senha@123')
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()
  await expect(page.getByText('Senha alterada')).toBeVisible()
  await expect(current).toHaveValue('')

  await logout(page, testInfo)
  await app.visit('/login')
  await page.getByLabel('E-mail').fill('ana@teste.com')
  await page.getByLabel('Senha').fill('NovaSenha@1')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).not.toHaveURL(/\/login/)
})

test('carteiras: cadastrar, editar, endereço inválido e papel duplicado', async ({ page, app }) => {
  await app.open('/')
  await app.login('bruno')
  await app.visit('/wallets')
  await expect(page.getByRole('heading', { name: 'Nenhuma carteira cadastrada' })).toBeVisible()

  await page.getByRole('button', { name: 'Adicionar carteira' }).click()
  const dialog = page.getByRole('dialog', { name: 'Adicionar carteira' })
  await dialog.getByLabel('Nome da carteira').fill('Principal do Bruno')
  await dialog.getByLabel('Endereço').fill('0x123')
  await dialog.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(dialog.getByLabel('Endereço')).toHaveAccessibleDescription(/Endereço inválido/)

  await dialog.getByLabel('Endereço').fill(`0x${'b'.repeat(40)}`)
  await dialog.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira cadastrada', { exact: true })).toBeVisible()
  await expect(page.getByRole('article', { name: 'Principal do Bruno' })).toBeVisible()

  // segunda principal: conflito no campo papel
  await page.getByRole('button', { name: 'Adicionar carteira' }).click()
  await dialog.getByLabel('Nome da carteira').fill('Outra principal')
  await dialog.getByLabel('Endereço').fill(`0x${'c'.repeat(40)}`)
  await dialog.getByRole('radio', { name: 'Principal' }).check()
  await dialog.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(dialog.getByRole('group', { name: 'Papel' })).toHaveAccessibleDescription('Você já tem uma carteira principal.')
  await page.keyboard.press('Escape')

  // editar
  await page.getByRole('button', { name: 'Editar Principal do Bruno' }).click()
  const edit = page.getByRole('dialog', { name: 'Editar carteira' })
  await edit.getByLabel('Nome da carteira').fill('Carteira Bruno')
  await edit.getByRole('checkbox', { name: 'Polygon' }).check()
  await edit.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByText('Carteira atualizada', { exact: true })).toBeVisible()
  await expect(page.getByRole('article', { name: 'Carteira Bruno' })).toContainText('Polygon')
})
