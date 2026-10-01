import { http } from '@/lib/http'
import type { Cart, Quote, QuoteRequest, UpsertCartItemRequest } from '@/contracts'

type ItemRef = Pick<UpsertCartItemRequest, 'nftId' | 'editionId'>

export const cartApi = {
  get: (signal?: AbortSignal) => http.get<Cart>('/cart', { signal }).then((r) => r.data),
  add: (body: UpsertCartItemRequest) => http.post<Cart>('/cart/items', body).then((r) => r.data),
  setQuantity: (body: UpsertCartItemRequest) => http.put<Cart>('/cart/items', body).then((r) => r.data),
  remove: ({ nftId, editionId }: ItemRef) =>
    http.delete<Cart>(`/cart/items/${nftId}/${editionId}`).then((r) => r.data),
  applyCoupon: (code: string) => http.post<Cart>('/cart/coupon', { code }).then((r) => r.data),
  removeCoupon: () => http.delete<Cart>('/cart/coupon').then((r) => r.data),
  acknowledge: () => http.post<Cart>('/cart/acknowledge').then((r) => r.data),
  quote: (body: QuoteRequest, signal?: AbortSignal) =>
    http.post<Quote>('/quotes', body, { signal }).then((r) => r.data),
}
