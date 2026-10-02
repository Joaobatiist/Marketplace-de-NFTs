import { expect, type Page, type TestInfo } from '@playwright/test'

export const isMobile = (testInfo: TestInfo) => testInfo.project.name === 'mobile'

/** do carrinho até a revisão do checkout, com "Confirmar compra" habilitado */
export async function goToReview(page: Page) {
  await page.goto('/cart')
  await page.getByRole('button', { name: 'Ir para pagamento' }).click()
  await page.getByRole('radio', { name: /Carteira principal/ }).check()
  await page.getByRole('radio', { name: 'Ethereum' }).check()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText(/Conectada/)).toBeVisible()
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()
}

/** painel de filtros: no desktop é a <aside>; no mobile abre o Sheet */
export async function openFilters(page: Page, testInfo: TestInfo) {
  if (!isMobile(testInfo)) return page.getByRole('complementary', { name: 'Filtros' })
  await page.getByRole('button', { name: /^Filtros/ }).click()
  return page.getByRole('dialog', { name: 'Filtros' })
}

/** sai pela interface (menu da conta no desktop, menu lateral no mobile) */
export async function logout(page: Page, testInfo: TestInfo) {
  if (isMobile(testInfo)) {
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Sair' }).click()
  } else {
    await page.getByRole('button', { name: /menu da conta/ }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
  }
  await expect(page.getByRole('link', { name: 'Entrar' }).filter({ visible: true }).first()).toBeVisible()
}

/** dispara uma requisição pelo app (passa pelo MSW, que roda dentro da página) */
export function apiFromPage(page: Page, method: string, url: string) {
  return page.evaluate(([m, u]) => fetch(u, { method: m }).then((r) => r.status), [method, url] as const)
}
