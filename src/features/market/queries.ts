import type { NftListParams } from '@/contracts'
import { nftListQueryOptions } from '@/features/catalog/queries'

/*
 * Mercado e Criadores agregam o catálogo inteiro numa página só (48 é o máximo da API; o seed tem 30).
 * É uma lista comum do catálogo: o tempo real já atualiza preço e estoque dela (apply-events).
 */
const ALL_NFTS: NftListParams = { sort: 'recent', page: 1, pageSize: 48 }

export const allNftsQueryOptions = nftListQueryOptions(ALL_NFTS)
