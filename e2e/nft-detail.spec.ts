import { expect, test } from './fixtures'

test('acesso direto a /nfts/nft_001', async ({ page, app }) => {
  await app.open('/nfts/nft_001')
  await expect(page.getByRole('heading', { level: 1, name: 'Cosmic Tiger #1' })).toBeVisible()
  await expect(page.getByRole('toolbar', { name: /Imagens de Cosmic Tiger #1/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Adicionar ao carrinho' })).toBeEnabled()
})

test('/nfts/nft_999 mostra "NFT não encontrado"', async ({ page, app }) => {
  await app.open('/nfts/nft_999')
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
  await page.getByRole('button', { name: 'Voltar ao catálogo' }).click()
  await expect(page).toHaveURL(/\/(\?.*)?$/)
})

test('edição Gold do nft_003 esgotada e desabilitada', async ({ page, app }) => {
  await app.open('/nfts/nft_003')
  const gold = page.getByRole('radio', { name: /Gold/ })
  await expect(gold).toBeDisabled()
  await expect(page.getByRole('group', { name: 'Edição:' }).getByText('Esgotada')).toBeVisible()
  await expect(page.getByRole('radio', { name: /Standard/ })).toBeChecked()
})

test('nft_007 indisponível (todas as edições esgotadas)', async ({ page, app }) => {
  await app.open('/nfts/nft_007')
  await expect(page.getByRole('button', { name: 'Indisponível' })).toBeDisabled()
  await expect(page.getByRole('button', { name: /^Aumentar quantidade/ })).toBeDisabled()
})

test('limite de quantidade por pedido', async ({ page, app }) => {
  await app.open('/nfts/nft_001')
  const plus = page.getByRole('button', { name: /^Aumentar quantidade/ })
  for (let i = 0; i < 4; i++) await plus.click()
  await expect(page.getByLabel('Qtd.')).toHaveValue('5')
  await expect(plus).toBeDisabled()
  await expect(page.getByText('Máximo de 5 por pedido')).toBeVisible()

  // digitar acima do limite corta no máximo
  await page.getByLabel('Qtd.').fill('9')
  await expect(page.getByLabel('Qtd.')).toHaveValue('5')
})
