import { test as base, expect, type Page } from '@playwright/test'

type Preset =
  | 'fast' | 'slow' | 'jitter' | 'offline' | 'server-error' | 'favorites-fail'
  | 'order-timeout' | 'payment-declined' | 'wallet-rejected'

export const USERS = {
  ana: { email: 'ana@teste.com', password: 'Senha@123', name: 'Ana Souza' },
  bruno: { email: 'bruno@teste.com', password: 'Senha@123', name: 'Bruno Lima' },
} as const

class App {
  constructor(private readonly page: Page) {}

  /** abre a rota com banco resetado e cenário definido */
  async open(path: string, preset: Preset = 'fast', { reset = true } = {}) {
    const url = new URL(path, 'http://app.local')
    if (reset) url.searchParams.set('reset', '1')
    url.searchParams.set('scenario', preset)
    await this.page.goto(url.pathname + url.search)
    await this.page.waitForFunction(() => '__mock' in window)
  }

  /** navega sem resetar (mantém sessão, carrinho e cenário atuais) */
  async visit(path: string) {
    await this.page.goto(path)
    await this.page.waitForFunction(() => '__mock' in window)
  }

  async login(user: keyof typeof USERS = 'ana') {
    const { email, password } = USERS[user]
    await this.visit('/login')
    await this.page.getByLabel('E-mail').fill(email)
    await this.page.getByLabel('Senha').fill(password)
    await this.page.getByRole('button', { name: 'Entrar' }).click()
    await expect(this.page).not.toHaveURL(/\/login/)
  }

  async addToCart(nftId: string) {
    await this.visit(`/nfts/${nftId}`)
    await this.page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
    await expect(this.page.getByText('Adicionado ao carrinho')).toBeVisible()
  }

  /** dispara mudança no servidor simulado → evento nft.updated pelo socket */
  async updateEdition(nftId: string, editionId: string, patch: { price?: string; available?: number }) {
    await this.page.evaluate(
      ([n, e, p]) => (window as unknown as { __mock: { updateEdition: Function } }).__mock.updateEdition(n, e, p),
      [nftId, editionId, patch] as const,
    )
  }

  async orderCount() {
    return this.page.evaluate(
      () => Object.keys((window as unknown as { __mock: { db: { orders: object } } }).__mock.db.orders).length,
    )
  }
}

export const test = base.extend<{ app: App }>({
  app: async ({ page }, use) => use(new App(page)),
})

export { expect }
