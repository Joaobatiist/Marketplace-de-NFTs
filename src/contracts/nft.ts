import type { EthAmount, ISODate } from './common'

export interface NftEdition {
  id: string
  name: string
  price: EthAmount
  supply: number
  available: number
  maxPerOrder: number
}

export interface Nft {
  id: string
  name: string
  description: string
  collection: string
  category: string
  creator: { name: string; avatarUrl: string }
  images: string[]
  editions: NftEdition[]
  featured: boolean
  createdAt: ISODate
  version: number
}

export type NftSort = 'recent' | 'price_asc' | 'price_desc' | 'name'

export interface NftListParams {
  q?: string
  category?: string
  minPrice?: EthAmount
  maxPrice?: EthAmount
  onlyAvailable?: boolean
  sort?: NftSort
  page?: number
  pageSize?: number
}