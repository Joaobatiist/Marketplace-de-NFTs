import axios, { isAxiosError } from 'axios'
import type { ApiError } from '@/contracts'

const TOKEN_KEY = 'nft-marketplace:token'
const GUEST_KEY = 'nft-marketplace:guest-id'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

/** id do visitante: mantém o carrinho de quem ainda não logou */
export function getGuestId() {
  let id = localStorage.getItem(GUEST_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(GUEST_KEY, id)
  }
  return id
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10_000,
})

http.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Guest-Id'] = getGuestId()
  return config
})

/** o módulo de auth registra aqui o que fazer quando a sessão expirar */
let onSessionExpired: (() => void) | null = null
export function setSessionExpiredHandler(fn: () => void) {
  onSessionExpired = fn
}

http.interceptors.response.use(undefined, (error) => {
  const apiError = toApiError(error)
  if (apiError.code === 'SESSION_EXPIRED' || apiError.code === 'UNAUTHORIZED') {
    // só dispara se havia sessão; login com senha errada não conta
    if (tokenStorage.get()) onSessionExpired?.()
  }
  return Promise.reject(error)
})

/** converte qualquer erro (HTTP, timeout, rede) no formato do contrato */
export function toApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const body = error.response?.data as Partial<ApiError> | undefined
    if (body?.code && body.message) return body as ApiError
    if (error.code === 'ECONNABORTED' || !error.response) {
      return { code: 'SERVICE_UNAVAILABLE', message: 'Não foi possível conectar. Verifique sua conexão e tente novamente.' }
    }
  }
  return { code: 'SERVICE_UNAVAILABLE', message: 'Algo deu errado. Tente novamente.' }
}