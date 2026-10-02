import { http, HttpResponse, delay, type DefaultBodyType, type PathParams } from 'msw'
import type { ApiError, Network, Wallet, WalletConnection } from '@/contracts'
import { db } from '../db'
import { scenario } from '../scenarios'
import { apiError, requireAuth } from '../utils'

export const walletHandlers = [
  http.get<PathParams, DefaultBodyType, Wallet[] | ApiError>('/api/wallets', async ({ request }) => {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    return HttpResponse.json(db.wallets[auth.user.id] ?? [])
  }),

  http.post<{ walletId: string }, { network: Network }, WalletConnection | ApiError>(
    '/api/wallets/:walletId/connect',
    async ({ request, params }) => {
      await delay(800)
      const auth = requireAuth(request)
      if ('error' in auth) return auth.error

      const wallet = (db.wallets[auth.user.id] ?? []).find((w) => w.id === params.walletId)
      if (!wallet) return apiError(404, 'NOT_FOUND', 'Carteira não encontrada.')

      const { network } = await request.json()
      if (!wallet.networks.includes(network)) {
        const msg = 'Esta carteira não suporta a rede selecionada.'
        return apiError(422, 'VALIDATION_ERROR', msg, { network: msg })
      }
      if (scenario.get().wallet === 'reject') {
        return apiError(403, 'WALLET_REJECTED', 'A conexão foi recusada na carteira.')
      }

      return HttpResponse.json({ walletId: wallet.id, network, connectedAt: new Date().toISOString() })
    },
  ),
]
