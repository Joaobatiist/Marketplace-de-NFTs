import { z } from 'zod'
import { NFT_CATEGORIES, NFT_SORTS, type NftListParams } from '@/contracts'

export const PAGE_SIZE = 12
const decimal = z.string().regex(/^\d+(\.\d+)?$/)

// .catch(): valor inválido na URL (ex.: ?page=abc) volta ao padrão em vez de quebrar a tela
export const catalogSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  category: z.enum(NFT_CATEGORIES).optional().catch(undefined),
  minPrice: decimal.optional().catch(undefined),
  maxPrice: decimal.optional().catch(undefined),
  onlyAvailable: z.boolean().optional().catch(undefined),
  sort: z.enum(NFT_SORTS).default('recent').catch('recent'),
  page: z.number().int().min(1).default(1).catch(1),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>
export type CatalogFilters = Pick<CatalogSearch, 'category' | 'minPrice' | 'maxPrice' | 'onlyAvailable'>

export const toListParams = (search: CatalogSearch): NftListParams => ({ ...search, pageSize: PAGE_SIZE })