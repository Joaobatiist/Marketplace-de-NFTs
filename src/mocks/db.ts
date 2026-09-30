import type { Nft, Order, Quote, User, Wallet } from '@/contracts/index'
import { seedNfts } from './fixtures/nfts'
import { seedUsers, seedWallets } from './fixtures/users'
import { seedCoupons } from './coupons'

const STORAGE_KEY = 'nft-marketplace:mock-db:v1'

export interface StoredUser extends User {
  passwordHash: string
}
export interface StoredSession {
  token: string
  userId: string
  expiresAt: string
}
export interface StoredCartItem {
  nftId: string
  editionId: string
  quantity: number
}
export interface Coupon {
  code: string
  percentOff: number
  expiresAt: string
}
export interface StoredQuote extends Quote {
  userId: string
}
export interface StoredOrder extends Order {
  userId: string
  idempotencyKey: string
  /** conteúdo da requisição serializado: detecta chave reutilizada com dados diferentes */
  requestFingerprint: string
}

export interface DbState {
  users: StoredUser[]
  sessions: StoredSession[]
  nfts: Nft[]
  coupons: Coupon[]
  favorites: Record<string, string[]> // userId -> nftIds
  carts: Record<string, StoredCartItem[]> // "user:ID" ou "guest:ID" -> itens
  wallets: Record<string, Wallet[]> // userId -> carteiras
  quotes: Record<string, StoredQuote>
  orders: Record<string, StoredOrder>
  seq: number
}

function createSeed(): DbState {
  return {
    users: structuredClone(seedUsers),
    sessions: [],
    nfts: structuredClone(seedNfts),
    coupons: structuredClone(seedCoupons),
    favorites: {},
    carts: {},
    wallets: structuredClone(seedWallets),
    quotes: {},
    orders: {},
    seq: 1,
  }
}

function load(): DbState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as DbState
  } catch {
    // storage indisponível ou corrompido: volta ao seed
  }
  return createSeed()
}

/** estado único: nunca reatribuir, só mutar (os handlers guardam a referência) */
export const db: DbState = load()

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // ignora: sem persistência o app continua funcionando em memória
  }
}

export function resetDb() {
  Object.assign(db, createSeed())
  persist()
}

/** ids determinísticos: mesmos passos geram os mesmos ids (bom para testes) */
export function nextId(prefix: string) {
  const id = `${prefix}_${String(db.seq).padStart(5, '0')}`
  db.seq += 1
  return id
}

export function cartKey(userId: string | null, guestId: string | null) {
  return userId ? `user:${userId}` : `guest:${guestId ?? 'anon'}`
}

export function findNft(nftId: string) {
  return db.nfts.find((n) => n.id === nftId)
}

export function findEdition(nftId: string, editionId: string) {
  return findNft(nftId)?.editions.find((e) => e.id === editionId)
}

/**
 * Único ponto que altera preço/disponibilidade.
 * Incrementa a versão — no Passo 11, também vai emitir o evento nft.updated,
 * garantindo que REST e socket nunca divirjam.
 */
export function updateEdition(
  nftId: string,
  editionId: string,
  patch: { price?: string; available?: number },
): Nft | undefined {
  const nft = findNft(nftId)
  const edition = nft?.editions.find((e) => e.id === editionId)
  if (!nft || !edition) return undefined

  Object.assign(edition, patch)
  nft.version += 1
  persist()
  return nft
}

export async function hashPassword(password: string) {
  const data = new TextEncoder().encode(`mock-salt:${password}`)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}