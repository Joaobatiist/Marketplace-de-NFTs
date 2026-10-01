import type { CreateOrderRequest } from '@/contracts'

const KEY = 'nft-marketplace:checkout-attempt'

export interface CheckoutAttempt {
  userId: string
  idempotencyKey: string
  request: CreateOrderRequest
  orderId?: string
}

/** tentativa de compra em andamento: sobrevive a refresh e é isolada por usuário */
export const attemptStorage = {
  get(userId: string): CheckoutAttempt | null {
    try {
      const attempt = JSON.parse(localStorage.getItem(KEY) ?? 'null') as CheckoutAttempt | null
      return attempt?.userId === userId ? attempt : null
    } catch {
      return null
    }
  },
  set: (attempt: CheckoutAttempt) => localStorage.setItem(KEY, JSON.stringify(attempt)),
  clear: () => localStorage.removeItem(KEY),
}
