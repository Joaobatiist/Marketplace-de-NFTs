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
  category: NftCategory
  creator: { name: string; avatarUrl: string }
  images: string[]
  editions: NftEdition[]
  featured: boolean
  createdAt: ISODate
  version: number
}
// ordem do Figma (filtro "Coleções"); rótulos em PT ficam no FilterPanel
export const NFT_CATEGORIES = [
  'digital_art',
  'photography',
  'music',
  'art_3d',
  'collectibles',
  'generative',
  'gaming',
  'memberships',
  'utility',
] as const
export type NftCategory = (typeof NFT_CATEGORIES)[number]

export const NFT_SORTS = ['recent', 'price_asc', 'price_desc', 'name'] as const
export type NftSort = (typeof NFT_SORTS)[number]

export interface NftListParams {
  q?: string
  category?: NftCategory
  minPrice?: EthAmount
  maxPrice?: EthAmount
  onlyAvailable?: boolean
  sort?: NftSort
  page?: number
  pageSize?: number
}