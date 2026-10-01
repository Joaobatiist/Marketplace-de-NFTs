import type { ISODate } from './common'

export const NETWORKS = ['ethereum', 'polygon', 'base'] as const
export type Network = (typeof NETWORKS)[number]

export interface Wallet {
  id: string
  label: string
  address: string
  role: 'primary' | 'secondary'
  networks: Network[]
}

export interface UpsertWalletRequest {
  label: string
  address: string
  role: 'primary' | 'secondary'
  networks: Network[]
}

export interface WalletConnection {
  walletId: string
  network: Network
  connectedAt: ISODate
}
