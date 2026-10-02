import type { Nft, NftUpdatedEvent, OrderStatus, OrderUpdatedEvent } from '@/contracts'

interface SocketIoClient {
  emit: (event: string, ...data: unknown[]) => void
}

export interface RealtimeClient {
  io: { client: SocketIoClient }
  close: () => void
  userId: string | null
}

export const clients = new Set<RealtimeClient>()

export function emitNftUpdated(nft: Nft) {
  const event: NftUpdatedEvent = {
    eventId: `nft.updated:${nft.id}:${nft.version}`,
    type: 'nft.updated',
    resourceId: nft.id,
    version: nft.version,
    occurredAt: new Date().toISOString(),
    payload: {
      editions: nft.editions.map((e) => ({ editionId: e.id, price: e.price, available: e.available })),
    },
  }
  for (const client of clients) client.io.client.emit('nft.updated', event)
}

export function emitOrderUpdated(order: {
  id: string
  userId: string
  version: number
  status: OrderStatus
  txHash: string | null
  declineReason: string | null
}) {
  const event: OrderUpdatedEvent = {
    eventId: `order.updated:${order.id}:${order.version}`,
    type: 'order.updated',
    resourceId: order.id,
    version: order.version,
    occurredAt: new Date().toISOString(),
    payload: { status: order.status, txHash: order.txHash, declineReason: order.declineReason },
  }
  // isolamento: só as conexões do dono do pedido recebem
  for (const client of clients) {
    if (client.userId === order.userId) client.io.client.emit('order.updated', event)
  }
}

/** apoio a testes: emitir evento arbitrário (duplicado, antigo) */
export function emitRaw(type: 'nft.updated' | 'order.updated', event: unknown) {
  for (const client of clients) client.io.client.emit(type, event)
}

/** apoio a testes: derrubar todas as conexões (o cliente reconecta sozinho) */
export function dropAllConnections() {
  for (const client of [...clients]) client.close()
}
