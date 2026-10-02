import type { EthAmount, ISODate } from './common'
import type { OrderStatus } from './order'

interface BaseEvent<TType extends string, TPayload> {
  /** identidade estável: permite descartar duplicatas */
  eventId: string
  type: TType
  resourceId: string
  /** versão do recurso após o evento: permite descartar eventos antigos */
  version: number
  occurredAt: ISODate
  payload: TPayload
}

export type NftUpdatedEvent = BaseEvent<
  'nft.updated',
  { editions: { editionId: string; price: EthAmount; available: number }[] }
>

export type OrderUpdatedEvent = BaseEvent<
  'order.updated',
  { status: OrderStatus; txHash: string | null; declineReason: string | null }
>

/** tipagem do socket.io-client: io<ServerToClientEvents, ClientToServerEvents>() */
export interface ServerToClientEvents {
  'nft.updated': (event: NftUpdatedEvent) => void
  'order.updated': (event: OrderUpdatedEvent) => void
}

export interface ClientToServerEvents {
  /** identifica o usuário da conexão; null = visitante */
  'session.join': (token: string | null) => void
}