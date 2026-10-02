import { http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw'
import type { ApiError, FavoritesResponse } from '@/contracts'
import { db, findNft, persist } from '../db'
import { apiError, requireAuth } from '../utils'

// o MSW deduz o tipo da resposta pelo primeiro `return`; com sucesso OU erro, declare os dois
// (PUT/DELETE respondem 204 sem corpo: sucesso é `null`)
export const favoriteHandlers = [
  http.get<PathParams, DefaultBodyType, FavoritesResponse | ApiError>('/api/favorites', async ({ request }) => {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    return HttpResponse.json<FavoritesResponse>({ nftIds: db.favorites[auth.user.id] ?? [] })
  }),

  // PUT e DELETE são idempotentes: repetir não duplica nem quebra
  http.put<PathParams, DefaultBodyType, null | ApiError>('/api/favorites/:nftId', async ({ request, params }) => {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    const nftId = String(params.nftId)
    if (!findNft(nftId)) return apiError(404, 'NOT_FOUND', 'NFT não encontrado.')

    const current = db.favorites[auth.user.id] ?? []
    if (!current.includes(nftId)) db.favorites[auth.user.id] = [...current, nftId]
    persist()
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete<PathParams, DefaultBodyType, null | ApiError>('/api/favorites/:nftId', async ({ request, params }) => {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    db.favorites[auth.user.id] = (db.favorites[auth.user.id] ?? []).filter((id) => id !== params.nftId)
    persist()
    return new HttpResponse(null, { status: 204 })
  }),
]