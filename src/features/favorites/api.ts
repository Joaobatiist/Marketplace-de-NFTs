import { http } from '@/lib/http'
import type { FavoritesResponse } from '@/contracts'

export const favoritesApi = {
  list: (signal?: AbortSignal) =>
    http.get<FavoritesResponse>('/favorites', { signal }).then((r) => r.data.nftIds),
  add: (nftId: string) => http.put(`/favorites/${nftId}`),
  remove: (nftId: string) => http.delete(`/favorites/${nftId}`),
}