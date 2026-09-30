import type { EthAmount, ISODate } from './common'
import type { QuoteLine } from './quote'
import type { Network } from './wallet'

export type OrderStatus = 'pending' | 'confirmed' | 'declined'

export interface Order {
  id: string
  status: OrderStatus
  /** snapshot: não muda se o catálogo mudar depois */
  lines: QuoteLine[]
  subtotal: EthAmount
  discount: EthAmount
  networkFee: EthAmount
  total: EthAmount
  network: Network
  walletId: string
  buyer: { name: string; email: string }
  txHash: string | null
  explorerUrl: string | null
  declineReason: string | null
  createdAt: ISODate
  version: number
}

/** enviado com o header Idempotency-Key */
export interface CreateOrderRequest {
  quoteId: string
  walletId: string
  network: Network
  buyer: { name: string; email: string }
}