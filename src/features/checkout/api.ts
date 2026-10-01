import { http } from '@/lib/http'
import type { CreateOrderRequest, Order } from '@/contracts'

export interface CreateOrderVars {
  idempotencyKey: string
  body: CreateOrderRequest
}

export const checkoutApi = {
  createOrder: ({ idempotencyKey, body }: CreateOrderVars) =>
    http.post<Order>('/orders', body, { headers: { 'Idempotency-Key': idempotencyKey } }).then((r) => r.data),
  order: (orderId: string, signal?: AbortSignal) =>
    http.get<Order>(`/orders/${orderId}`, { signal }).then((r) => r.data),
}
