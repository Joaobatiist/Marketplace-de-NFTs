import type { EthAmount } from './common'

export interface CartItem {
  nftId: string
  editionId: string
  quantity: number
  unitPrice: EthAmount
  name: string
  image: string
}

export interface Cart {
  items: CartItem[]
}

export interface UpsertCartItemRequest {
  nftId: string
  editionId: string
  quantity: number
}