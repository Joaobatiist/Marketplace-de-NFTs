import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { NftListParams } from '@/contracts'
import { catalogApi } from './api'

/** fábrica de chaves: o socket (passo 11) usa isso para atualizar listas e detalhe */
export const nftKeys = {
  all: ['nfts'] as const,
  lists: () => [...nftKeys.all, 'list'] as const,
  list: (params: NftListParams) => [...nftKeys.lists(), params] as const,
  featured: () => [...nftKeys.all, 'featured'] as const,
  detail: (nftId: string) => [...nftKeys.all, 'detail', nftId] as const,
}

export const nftListQueryOptions = (params: NftListParams) =>
  queryOptions({
    queryKey: nftKeys.list(params),
    queryFn: ({ signal }) => catalogApi.list(params, signal),
    placeholderData: keepPreviousData, // mantém a página anterior visível enquanto a nova carrega
  })

export const featuredQueryOptions = queryOptions({
  queryKey: nftKeys.featured(),
  queryFn: ({ signal }) => catalogApi.featured(signal),
})

export const nftDetailQueryOptions = (nftId: string) =>
  queryOptions({
    queryKey: nftKeys.detail(nftId),
    queryFn: ({ signal }) => catalogApi.detail(nftId, signal),
  })