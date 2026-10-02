import { expect, test } from './fixtures'

test('favoritar sem login leva ao login', async ({ page, app }) => {
  await app.open('/nfts/nft_001')
  await page.getByRole('button', { name: 'Favoritar Cosmic Tiger #1' }).click()
  await expect(page).toHaveURL(/\/login\?redirect=.*nft_001/)
})

test('favoritar e desfavoritar persiste após refresh', async ({ page, app }) => {
  await app.open('/')
  await app.login('ana')
  await app.visit('/nfts/nft_001')
  const heart = page.getByRole('button', { name: 'Favoritar Cosmic Tiger #1' })

  await heart.click()
  await expect(heart).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await page.waitForFunction(() => '__mock' in window)
  await expect(heart).toHaveAttribute('aria-pressed', 'true')

  await heart.click()
  await expect(heart).toHaveAttribute('aria-pressed', 'false')
  await page.reload()
  await page.waitForFunction(() => '__mock' in window)
  await expect(heart).toHaveAttribute('aria-pressed', 'false')
})

test('favorites-fail: o coração volta (rollback) e aparece um toast', async ({ page, app }) => {
  await app.open('/', 'favorites-fail')
  await app.login('ana')
  await app.visit('/nfts/nft_001')
  const heart = page.getByRole('button', { name: 'Favoritar Cosmic Tiger #1' })
  await expect(heart).toHaveAttribute('aria-pressed', 'false')

  await heart.click()
  await expect(page.getByText('Não foi possível favoritar.')).toBeVisible()
  await expect(heart).toHaveAttribute('aria-pressed', 'false')
})
