import type { Wallet } from '@/contracts/wallet'
import type { StoredUser } from '../db'

// SHA-256 de "mock-salt:Senha@123" — nunca guardar senha em claro
const DEFAULT_PASSWORD_HASH = 'ed640a36353836b9b2e9ac964edbf72ba9462eee62fbe94d550cd3957e32f11d'

export const seedUsers: StoredUser[] = [
  {
    id: 'usr_ana',
    name: 'Ana Souza',
    email: 'ana@teste.com',
    avatarUrl: null,
    username: 'anasouza',
    ensName: 'anasouza.eth',
    walletNickname: 'Cofre da Ana',
    passwordHash: DEFAULT_PASSWORD_HASH,
  },
  {
    id: 'usr_bruno',
    name: 'Bruno Lima',
    email: 'bruno@teste.com',
    avatarUrl: null,
    username: 'brunolima',
    ensName: 'brunolima.eth',
    walletNickname: 'Carteira do Bruno',
    passwordHash: DEFAULT_PASSWORD_HASH,
  },
]

export const seedWallets: Record<string, Wallet[]> = {
  usr_ana: [
    {
      id: 'wal_ana_1',
      label: 'Carteira principal',
      address: '0x1111111111111111111111111111111111111111',
      role: 'primary',
      networks: ['ethereum', 'base'],
      provider: 'metamask',
      ens: 'anasouza.eth',
    },
    {
      id: 'wal_ana_2',
      label: 'Carteira secundária',
      address: '0x2222222222222222222222222222222222222222',
      role: 'secondary',
      networks: ['polygon'],
      provider: 'coinbase',
      ens: null,
    },
  ],
  usr_bruno: [], // sem carteiras: testa o estado vazio
}
