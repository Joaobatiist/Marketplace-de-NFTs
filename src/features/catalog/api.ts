import { http } from '@/lib/http'
import type { Nft, NftListParams, Paginated } from '@/contracts'

export const catalogApi = {
  list: (params: NftListParams, signal?: AbortSignal) =>
    http.get<Paginated<Nft>>('/nfts', { params, signal }).then((r) => r.data),
  featured: (signal?: AbortSignal) =>
    http.get<Nft[]>('/nfts/featured', { signal }).then((r) => r.data),
  detail: (nftId: string, signal?: AbortSignal) =>
    http.get<Nft>(`/nfts/${nftId}`, { signal }).then((r) => r.data),
}