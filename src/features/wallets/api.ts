import { http } from '@/lib/http'
import type { Network, Wallet, WalletConnection } from '@/contracts'

export const walletsApi = {
  list: (signal?: AbortSignal) => http.get<Wallet[]>('/wallets', { signal }).then((r) => r.data),
  connect: ({ walletId, network }: { walletId: string; network: Network }) =>
    http.post<WalletConnection>(`/wallets/${walletId}/connect`, { network }).then((r) => r.data),
}
