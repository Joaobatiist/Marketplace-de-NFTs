import type { Network, Order } from '@/contracts'
import { cartKey, db, findEdition, persist, updateEdition, type StoredOrder } from './db'
import { emitOrderUpdated } from './realtime'

export const PAYMENT_DELAY_MS = 5000

const EXPLORERS: Record<Network, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  base: 'https://basescan.org/tx/',
}

export function toPublicOrder(order: StoredOrder): Order {
  const { userId: _u, idempotencyKey: _k, requestFingerprint: _f, settleAt: _s, outcome: _o, ...rest } = order
  return rest
}

function fakeTxHash(orderId: string) {
  const hex = [...orderId].map((c) => c.charCodeAt(0).toString(16)).join('')
  return `0x${hex.padEnd(64, '0').slice(0, 64)}`
}

/** remove do carrinho apenas o que foi comprado (o carrinho pode ter mudado desde o pedido) */
function removePurchasedFromCart(order: StoredOrder) {
  const key = cartKey(order.userId, null)
  db.carts[key] = (db.carts[key] ?? [])
    .map((item) => {
      const bought = order.lines.find((l) => l.nftId === item.nftId && l.editionId === item.editionId)
      return bought ? { ...item, quantity: item.quantity - bought.quantity } : item
    })
    .filter((item) => item.quantity > 0)
  if (order.discount !== '0') delete db.cartCoupons[key]
}

/**
 * Resolve o pedido se o prazo passou. Chamada no timer e em toda leitura do pedido,
 * então um pedido pendente se resolve mesmo após refresh da página.
 * No passo 12, também emitirá o evento order.updated.
 */
export function settleIfDue(order: StoredOrder | undefined) {
  if (!order || order.status !== 'pending') return
  if (Date.now() < new Date(order.settleAt).getTime()) return

  if (order.outcome === 'declined') {
    // devolve o estoque reservado
    for (const line of order.lines) {
      const edition = findEdition(line.nftId, line.editionId)
      if (edition) {
        updateEdition(line.nftId, line.editionId, { available: edition.available + line.quantity })
      }
    }
    order.status = 'declined'
    order.declineReason = 'O pagamento foi recusado pela carteira.'
  } else {
    order.status = 'confirmed'
    order.txHash = fakeTxHash(order.id)
    order.explorerUrl = EXPLORERS[order.network] + order.txHash
    removePurchasedFromCart(order)
  }

  order.version += 1
  emitOrderUpdated(order)
  persist()
}
