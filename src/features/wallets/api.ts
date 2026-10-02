import { http } from '@/lib/http'
import type { Network, UpsertWalletRequest, Wallet, WalletConnection } from '@/contracts'

export const walletsApi = {
  list: (signal?: AbortSignal) => http.get<Wallet[]>('/wallets', { signal }).then((r) => r.data),
  connect: ({ walletId, network }: { walletId: string; network: Network }) =>
    http.post<WalletConnection>(`/wallets/${walletId}/connect`, { network }).then((r) => r.data),
  create: (body: UpsertWalletRequest) => http.post<Wallet>('/wallets', body).then((r) => r.data),
  update: ({ id, ...body }: UpsertWalletRequest & { id: string }) =>
    http.put<Wallet>(`/wallets/${id}`, body).then((r) => r.data),
}
