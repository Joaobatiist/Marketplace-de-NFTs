export type Network = 'ethereum' | 'polygon' | 'base'

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