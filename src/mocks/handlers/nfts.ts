import { http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw'
import type { ApiError, Nft, NftSort, Paginated } from '@/contracts'
import { isSoldOut, minEditionPrice, toDecimal } from '@/lib/eth'
import { db } from '../db'
import { apiError } from '../utils'

const sorters: Record<NftSort, (a: Nft, b: Nft) => number> = {
  recent: (a, b) => b.createdAt.localeCompare(a.createdAt),
  name: (a, b) => a.name.localeCompare(b.name),
  price_asc: (a, b) => toDecimal(minEditionPrice(a)).comparedTo(minEditionPrice(b)),
  price_desc: (a, b) => toDecimal(minEditionPrice(b)).comparedTo(minEditionPrice(a)),
}

export const nftHandlers = [
  // "featured" antes de ":id", senão o MSW trata "featured" como um id
  http.get('/api/nfts/featured', async () => {
    return HttpResponse.json<Nft[]>(db.nfts.filter((n) => n.featured))
  }),

  http.get('/api/nfts', async ({ request }) => {
    const p = new URL(request.url).searchParams
    const q = p.get('q')?.trim().toLowerCase()
    const category = p.get('category')
    const minPrice = p.get('minPrice')
    const maxPrice = p.get('maxPrice')
    const onlyAvailable = p.get('onlyAvailable') === 'true'
    const sort = (p.get('sort') as NftSort) ?? 'recent'

    const filtered = db.nfts
      .filter((n) => !q || `${n.name} ${n.collection} ${n.creator.name}`.toLowerCase().includes(q))
      .filter((n) => !category || n.category === category)
      .filter((n) => !minPrice || toDecimal(minEditionPrice(n)).gte(minPrice))
      .filter((n) => !maxPrice || toDecimal(minEditionPrice(n)).lte(maxPrice))
      .filter((n) => !onlyAvailable || !isSoldOut(n))
      .sort(sorters[sort] ?? sorters.recent)

    const pageSize = Math.min(Math.max(Number(p.get('pageSize')) || 12, 1), 48)
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const page = Math.max(Number(p.get('page')) || 1, 1)

    return HttpResponse.json<Paginated<Nft>>({
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      total: filtered.length,
      totalPages,
    })
  }),

  // sucesso OU erro: declara os dois, senão o MSW fixa o tipo pelo primeiro return (ver auth.ts)
  http.get<PathParams, DefaultBodyType, Nft | ApiError>('/api/nfts/:nftId', async ({ params }) => {
    const nft = db.nfts.find((n) => n.id === params.nftId)
    if (!nft) return apiError(404, 'NOT_FOUND', 'NFT não encontrado.')
    return HttpResponse.json<Nft>(nft)
  }),
]