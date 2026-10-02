import type { ISODate } from './common'

export const NETWORKS = ['ethereum', 'polygon', 'base'] as const
export type Network = (typeof NETWORKS)[number]

/** "Tipo de carteira" (Figma): os provedores de "Carteiras compatíveis" */
export const WALLET_PROVIDERS = ['metamask', 'walletconnect', 'coinbase'] as const
export type WalletProvider = (typeof WALLET_PROVIDERS)[number]

export interface Wallet {
  id: string
  label: string
  address: string
  role: 'primary' | 'secondary'
  networks: Network[]
  provider: WalletProvider
  /** "ENS ou carteira secundária (opcional)" */
  ens: string | null
}

export interface UpsertWalletRequest {
  label: string
  address: string
  role: 'primary' | 'secondary'
  networks: Network[]
  provider: WalletProvider
  ens?: string | null
}

export interface WalletConnection {
  walletId: string
  network: Network
  connectedAt: ISODate
}
