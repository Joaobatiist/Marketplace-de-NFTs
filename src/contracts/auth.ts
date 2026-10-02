import type { ISODate } from './common'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  /** identificador público, único (Figma: "Nome de usuário") */
  username: string
  /** nome ENS completo, ex.: "anasouza.eth" */
  ensName: string
  /** como o usuário chama a própria carteira (Figma: "Apelido da carteira") */
  walletNickname: string
}

export interface Session {
  user: User
  expiresAt: ISODate
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface UpdateProfileRequest {
  name?: string
  email?: string
  avatarUrl?: string | null
  username?: string
  ensName?: string
  walletNickname?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface AuthResponse {
  session: Session
  token: string
}

export interface FavoritesResponse {
  nftIds: string[]
}