import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { isMobile } from './helpers'

/** Tab até o elemento focado casar com o seletor (limite de tentativas) */
async function tabUntil(page: Page, matches: () => Promise<boolean>, max = 80) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab')
    if (await matches()) return true
  }
  return false
}

test('teclado: do header até um card e Enter abre o detalhe', async ({ page, app }) => {
  await app.open('/')
  await expect(page.locator('main article').first()).toBeVisible()
  const reached = await tabUntil(page, () => page.evaluate(() => !!document.activeElement?.closest('main article')))
  expect(reached).toBe(true)
  const name = await page.evaluate(() => document.activeElement?.textContent)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/nfts\/nft_/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name ?? '')
})

test('skip link leva o foco ao conteúdo principal', async ({ page, app }) => {
  await app.open('/')
  await expect(page.locator('main article').first()).toBeVisible() // o app monta depois do MSW
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.locator('main#main')).toBeFocused()
})

for (const [label, trigger, dialogName] of [
  ['filtros', /^Filtros/, 'Filtros'],
  ['menu', 'Abrir menu', 'KURIO'],
] as const) {
  test(`foco preso e devolvido no Sheet de ${label} (mobile)`, async ({ page, app }, testInfo) => {
    test.skip(!isMobile(testInfo), 'Sheet só existe no mobile')
    await app.open('/')
    const button = page.getByRole('button', { name: trigger })
    await button.click()
    const dialog = page.getByRole('dialog', { name: dialogName })
    await expect(dialog).toBeVisible()

    // Tab várias vezes: o foco nunca sai do Sheet
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab')
      expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(button).toBeFocused()
  })
}

test('login: mensagens de erro associadas aos campos (aria-describedby)', async ({ page, app }) => {
  await app.open('/login')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByLabel('E-mail')).toHaveAccessibleDescription('Informe o e-mail')
  await expect(page.getByLabel('Senha')).toHaveAccessibleDescription('Informe a senha')

  await page.getByLabel('E-mail').fill('ana@teste.com')
  await page.getByLabel('Senha').fill('senhaerrada')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('alert')).toHaveText('E-mail ou senha inválidos.')
})
