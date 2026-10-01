import type { EthAmount } from './common'

export interface CartItem {
  nftId: string
  editionId: string
  editionName: string
  name: string
  image: string
  quantity: number
  /** preço atual da edição */
  unitPrice: EthAmount
  /** preço quando o usuário adicionou ou aceitou a última mudança */
  priceSeen: EthAmount
  available: number
  maxPerOrder: number
}

export interface Cart {
  items: CartItem[]
  couponCode: string | null
}

export interface UpsertCartItemRequest {
  nftId: string
  editionId: string
  quantity: number
}

export interface ApplyCouponRequest {
  code: string
}
