import { HttpResponse } from 'msw'
import type { ZodError } from 'zod'
import type { ApiError, ApiErrorCode, Session, User } from '@/contracts'
import { cartKey, db, findEdition, type StoredSession, type StoredUser } from './db'

const SESSION_TTL_MS = 30 * 60 * 1000

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
) {
  return HttpResponse.json<ApiError>({ code, message, fieldErrors }, { status })
}

export function validationError(error: ZodError) {
  const fieldErrors = Object.fromEntries(error.issues.map((i) => [i.path.join('.'), i.message]))
  return apiError(422, 'VALIDATION_ERROR', 'Verifique os campos destacados.', fieldErrors)
}

export function toPublicUser({ passwordHash: _, ...user }: StoredUser): User {
  return user
}

export function toSession(user: StoredUser, session: StoredSession): Session {
  return { user: toPublicUser(user), expiresAt: session.expiresAt }
}

export function createSession(userId: string): StoredSession {
  const session = {
    token: crypto.randomUUID(),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  }
  db.sessions.push(session)
  return session
}

/** use em todo handler privado: if ('error' in auth) return auth.error */
export function requireAuth(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  const session = token ? db.sessions.find((s) => s.token === token) : undefined

  if (!session) {
    return { error: apiError(401, 'UNAUTHORIZED', 'Faça login para continuar.') } as const
  }
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return { error: apiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.') } as const
  }
  const user = db.users.find((u) => u.id === session.userId)!
  return { user, session } as const
}

/** leva o carrinho do visitante para o usuário, respeitando estoque e limite */
export function mergeGuestCart(guestId: string | null, userId: string) {
  const guestKey = cartKey(null, guestId)
  const userKey = cartKey(userId, null)
  const guestItems = db.carts[guestKey] ?? []
  if (guestItems.length === 0) return

  const merged = [...(db.carts[userKey] ?? [])]
  for (const item of guestItems) {
    const edition = findEdition(item.nftId, item.editionId)
    if (!edition) continue
    const limit = Math.min(edition.available, edition.maxPerOrder)
    const existing = merged.find((i) => i.nftId === item.nftId && i.editionId === item.editionId)
    if (existing) existing.quantity = Math.min(existing.quantity + item.quantity, limit)
    else if (limit > 0) merged.push({ ...item, quantity: Math.min(item.quantity, limit) })
  }

  db.carts[userKey] = merged.filter((i) => i.quantity > 0)
  if (db.cartCoupons[guestKey] && !db.cartCoupons[userKey]) {
    db.cartCoupons[userKey] = db.cartCoupons[guestKey]
  }
  delete db.cartCoupons[guestKey]
  delete db.carts[guestKey]
}

/** carrinho de quem? token válido = usuário; sem token = visitante; token inválido = erro de sessão */
export function resolveCartOwner(request: Request) {
  if (request.headers.get('Authorization')) {
    const auth = requireAuth(request)
    // `'error' in auth` não estreita aqui (o outro membro vira `error?: undefined`); estreitar pelo valor
    if (auth.error) return { error: auth.error } as const
    return { key: cartKey(auth.user.id, null) } as const
  }
  return { key: cartKey(null, request.headers.get('X-Guest-Id')) } as const
}