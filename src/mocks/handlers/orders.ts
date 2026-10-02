import { http, HttpResponse, delay, type DefaultBodyType, type PathParams } from 'msw'
import { buyerSchema, type ApiError, type CreateOrderRequest, type Order, type Quote } from '@/contracts'
import { cartKey, db, findEdition, nextId, persist, updateEdition, type StoredOrder } from '../db'
import { buildQuote } from '../quote'
import { PAYMENT_DELAY_MS, settleIfDue, toPublicOrder } from '../orders'
import { scenario } from '../scenarios'
import { apiError, requireAuth, validationError } from '../utils'

/** a cotação revisada continua válida? (mesmos itens, quantidades, preços, total e sem pendências) */
function sameQuote(reviewed: Quote, fresh: Quote) {
  return (
    fresh.issues.length === 0 &&
    reviewed.total === fresh.total &&
    reviewed.lines.length === fresh.lines.length &&
    reviewed.lines.every((l, i) => {
      const f = fresh.lines[i]
      return l.nftId === f.nftId && l.editionId === f.editionId && l.quantity === f.quantity && l.unitPrice === f.unitPrice
    })
  )
}

export const orderHandlers = [
  http.post<PathParams, CreateOrderRequest, Order | ApiError>('/api/orders', async ({ request }) => {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const key = request.headers.get('Idempotency-Key')
    if (!key) return apiError(422, 'VALIDATION_ERROR', 'Cabeçalho Idempotency-Key ausente.')

    const body = await request.json()
    const fingerprint = JSON.stringify([body.quoteId, body.walletId, body.network, body.buyer?.name, body.buyer?.email])

    // 1º: idempotência ANTES de qualquer validação — a mesma tentativa sempre recupera o mesmo pedido
    const existing = Object.values(db.orders).find((o) => o.userId === auth.user.id && o.idempotencyKey === key)
    if (existing) {
      if (existing.requestFingerprint !== fingerprint) {
        return apiError(409, 'IDEMPOTENCY_CONFLICT', 'Esta tentativa de compra já foi usada com outros dados.')
      }
      settleIfDue(existing)
      return HttpResponse.json(toPublicOrder(existing))
    }

    const buyer = buyerSchema.safeParse(body.buyer)
    if (!buyer.success) return validationError(buyer.error)

    const wallet = (db.wallets[auth.user.id] ?? []).find((w) => w.id === body.walletId)
    if (!wallet) return apiError(422, 'VALIDATION_ERROR', 'Selecione uma carteira válida.', { walletId: 'Carteira inválida.' })
    if (!wallet.networks.includes(body.network)) {
      return apiError(422, 'VALIDATION_ERROR', 'Rede não suportada pela carteira.', { network: 'Rede inválida.' })
    }

    // 2º: revalida tudo contra o estado atual
    const ownerKey = cartKey(auth.user.id, null)
    const reviewed = db.quotes[body.quoteId]
    const fresh = buildQuote(ownerKey, body.network)
    const reviewedIsValid =
      reviewed &&
      reviewed.userId === ownerKey &&
      reviewed.network === body.network &&
      new Date(reviewed.expiresAt).getTime() > Date.now() &&
      sameQuote(reviewed, fresh)

    if (!reviewedIsValid) {
      return apiError(409, 'QUOTE_OUTDATED', 'Os valores mudaram desde a revisão. Confira e confirme novamente.')
    }
    if (fresh.lines.length === 0) return apiError(422, 'VALIDATION_ERROR', 'Seu carrinho está vazio.')

    // 3º: reserva o estoque enquanto o pagamento é processado
    for (const line of fresh.lines) {
      const edition = findEdition(line.nftId, line.editionId)!
      updateEdition(line.nftId, line.editionId, { available: edition.available - line.quantity })
    }

    const now = Date.now()
    const order: StoredOrder = {
      id: nextId('ord'),
      status: 'pending',
      lines: fresh.lines, // snapshot
      subtotal: fresh.subtotal,
      discount: fresh.discount,
      networkFee: fresh.networkFee,
      total: fresh.total,
      network: body.network,
      walletId: wallet.id,
      buyer: buyer.data,
      txHash: null,
      explorerUrl: null,
      declineReason: null,
      createdAt: new Date(now).toISOString(),
      version: 1,
      userId: auth.user.id,
      idempotencyKey: key,
      requestFingerprint: fingerprint,
      settleAt: new Date(now + PAYMENT_DELAY_MS).toISOString(),
      outcome: scenario.get().payment === 'decline' ? 'declined' : 'confirmed',
    }
    db.orders[order.id] = order
    persist()

    if (scenario.get().orderTimeoutOnce) {
      scenario.set({ orderTimeoutOnce: false })
      // o pedido FOI criado, mas a resposta só chega depois do timeout do cliente (10 s)
      await delay(15_000)
    }

    setTimeout(() => settleIfDue(db.orders[order.id]), PAYMENT_DELAY_MS + 50)
    return HttpResponse.json(toPublicOrder(order), { status: 201 })
  }),

  http.get<{ orderId: string }, DefaultBodyType, Order | ApiError>('/api/orders/:orderId', async ({ request, params }) => {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error

    const order = db.orders[params.orderId]
    // pedido de outro usuário responde 404, e não 403, para não revelar que ele existe
    if (!order || order.userId !== auth.user.id) return apiError(404, 'NOT_FOUND', 'Pedido não encontrado.')

    settleIfDue(order)
    return HttpResponse.json(toPublicOrder(order))
  }),
]
