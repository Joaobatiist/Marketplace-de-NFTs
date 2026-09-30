import type { EthAmount, ISODate } from './common'
import type { Network } from './wallet'

export interface QuoteRequest {
  couponCode?: string
  network: Network
}

export interface QuoteLine {
  nftId: string
  editionId: string
  name: string
  quantity: number
  unitPrice: EthAmount
  lineTotal: EthAmount
}

export type QuoteIssue =
  | { type: 'PRICE_CHANGED'; nftId: string; editionId: string; oldPrice: EthAmount; newPrice: EthAmount }
  | { type: 'OUT_OF_STOCK'; nftId: string; editionId: string }
  | { type: 'QUANTITY_REDUCED'; nftId: string; editionId: string; available: number }

export interface Quote {
  id: string
  lines: QuoteLine[]
  subtotal: EthAmount
  discount: EthAmount
  networkFee: EthAmount
  total: EthAmount
  coupon: { code: string; percentOff: number } | null
  network: Network
  expiresAt: ISODate
  /** mudanças detectadas em relação ao carrinho; se houver, exige nova confirmação */
  issues: QuoteIssue[]
}