import type { ISODate } from './common'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
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
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface AuthResponse {
  session: Session
  token: string
}