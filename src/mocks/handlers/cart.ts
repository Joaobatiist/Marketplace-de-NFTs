import { http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw'
import type {
  ApiError, ApplyCouponRequest, Cart, Quote, QuoteRequest, UpsertCartItemRequest,
} from '@/contracts'
import { db, findEdition, findNft, persist } from '../db'
import { buildQuote } from '../quote'
import { apiError, resolveCartOwner } from '../utils'

type CartRes = Cart | ApiError

function toCart(key: string): Cart {
  const items = (db.carts[key] ?? []).flatMap((item) => {
    const nft = findNft(item.nftId)
    const edition = findEdition(item.nftId, item.editionId)
    if (!nft || !edition) return []
    return [{
      nftId: nft.id,
      editionId: edition.id,
      editionName: edition.name,
      name: nft.name,
      image: nft.images[0],
      quantity: item.quantity,
      unitPrice: edition.price,
      priceSeen: item.priceSeen,
      available: edition.available,
      maxPerOrder: edition.maxPerOrder,
    }]
  })
  return { items, couponCode: db.cartCoupons[key] ?? null }
}

function validateQuantity(nftId: string, editionId: string, quantity: number) {
  const edition = findEdition(nftId, editionId)
  if (!edition) return apiError(404, 'NOT_FOUND', 'Edição não encontrada.')
  if (!Number.isInteger(quantity) || quantity < 1) {
    return apiError(422, 'VALIDATION_ERROR', 'Quantidade inválida.', {
      quantity: 'Informe uma quantidade inteira maior que zero.',
    })
  }
  const limit = Math.min(edition.available, edition.maxPerOrder)
  if (limit === 0) return apiError(409, 'OUT_OF_STOCK', 'Esta edição está esgotada.')
  if (quantity > limit) return apiError(409, 'OUT_OF_STOCK', `Disponível no máximo ${limit} unidade(s).`)
  return null
}

export const cartHandlers = [
  http.get<PathParams, DefaultBodyType, CartRes>('/api/cart', async ({ request }) => {
    const owner = resolveCartOwner(request)
    if ('error' in owner) return owner.error
    return HttpResponse.json(toCart(owner.key))
  }),

  // adicionar a partir do detalhe: soma à quantidade existente
  http.post<PathParams, UpsertCartItemRequest, CartRes>('/api/cart/items', async ({ request }) => {
    const owner = resolveCartOwner(request)
    if ('error' in owner) return owner.error
    const { nftId, editionId, quantity } = await request.json()

    const items = db.carts[owner.key] ?? []
    const existing = items.find((i) => i.nftId === nftId && i.editionId === editionId)
    const invalid = validateQuantity(nftId, editionId, (existing?.quantity ?? 0) + quantity)
    if (invalid) return invalid

    if (existing) existing.quantity += quantity
    else items.push({ nftId, editionId, quantity, priceSeen: findEdition(nftId, editionId)!.price })
    db.carts[owner.key] = items
    persist()
    return HttpResponse.json(toCart(owner.key))
  }),

  // alterar no carrinho: define a quantidade exata
  http.put<PathParams, UpsertCartItemRequest, CartRes>('/api/cart/items', async ({ request }) => {
    const owner = resolveCartOwner(request)
    if ('error' in owner) return owner.error
    const { nftId, editionId, quantity } = await request.json()

    const item = db.carts[owner.key]?.find((i) => i.nftId === nftId && i.editionId === editionId)
    if (!item) return apiError(404, 'NOT_FOUND', 'Item não está no carrinho.')
    const invalid = validateQuantity(nftId, editionId, quantity)
    if (invalid) return invalid

    item.quantity = quantity
    persist()
    return HttpResponse.json(toCart(owner.key))
  }),

  http.delete<{ nftId: string; editionId: string }, DefaultBodyType, CartRes>(
    '/api/cart/items/:nftId/:editionId',
    async ({ request, params }) => {
      const owner = resolveCartOwner(request)
      if ('error' in owner) return owner.error
      db.carts[owner.key] = (db.carts[owner.key] ?? []).filter(
        (i) => !(i.nftId === params.nftId && i.editionId === params.editionId),
      )
      persist()
      return HttpResponse.json(toCart(owner.key))
    },
  ),

  http.post<PathParams, ApplyCouponRequest, CartRes>('/api/cart/coupon', async ({ request }) => {
    const owner = resolveCartOwner(request)
    if ('error' in owner) return owner.error
    const code = (await request.json()).code?.trim().toUpperCase() ?? ''

    const coupon = db.coupons.find((c) => c.code === code)
    if (!coupon) return apiError(422, 'COUPON_INVALID', 'Cupom inválido.', { code: 'Cupom inválido.' })
    if (new Date(coupon.expiresAt).getTime() <= Date.now()) {
      return apiError(422, 'COUPON_EXPIRED', 'Este cupom expirou.', { code: 'Este cupom expirou.' })
    }

    db.cartCoupons[owner.key] = coupon.code
    persist()
    return HttpResponse.json(toCart(owner.key))
  }),

  http.delete<PathParams, DefaultBodyType, CartRes>('/api/cart/coupon', async ({ request }) => {
    const owner = resolveCartOwner(request)
    if ('error' in owner) return owner.error
    delete db.cartCoupons[owner.key]
    persist()
    return HttpResponse.json(toCart(owner.key))
  }),

  // usuário aceita as mudanças: atualiza preços vistos, ajusta quantidades e remove esgotados
  http.post<PathParams, DefaultBodyType, CartRes>('/api/cart/acknowledge', async ({ request }) => {
    const owner = resolveCartOwner(request)
    if ('error' in owner) return owner.error
    db.carts[owner.key] = (db.carts[owner.key] ?? []).flatMap((item) => {
      const edition = findEdition(item.nftId, item.editionId)
      if (!edition) return []
      const limit = Math.min(edition.available, edition.maxPerOrder)
      if (limit === 0) return []
      return [{ ...item, quantity: Math.min(item.quantity, limit), priceSeen: edition.price }]
    })
    persist()
    return HttpResponse.json(toCart(owner.key))
  }),

  http.post<PathParams, QuoteRequest, Quote | ApiError>('/api/quotes', async ({ request }) => {
    const owner = resolveCartOwner(request)
    if ('error' in owner) return owner.error
    const { network } = await request.json()
    const { userId: _, ...quote } = buildQuote(owner.key, network)
    return HttpResponse.json(quote)
  }),
]
