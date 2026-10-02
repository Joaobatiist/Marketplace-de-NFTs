import { http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw'
import {
  changePasswordSchema, profileSchema, supportSchema, walletSchema,
  type ApiError, type ChangePasswordRequest, type CouponOffer, type Order, type SupportRequest, type SupportTicket,
  type UpdateProfileRequest, type UpsertWalletRequest, type User, type Wallet,
} from '@/contracts'
import { db, hashPassword, nextId, persist } from '../db'
import { settleIfDue, toPublicOrder } from '../orders'
import { apiError, requireAuth, toPublicUser, validationError } from '../utils'

export const accountHandlers = [
  http.get<PathParams, DefaultBodyType, User | ApiError>('/api/profile', ({ request }) => {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    return HttpResponse.json(toPublicUser(auth.user))
  }),

  http.patch<PathParams, UpdateProfileRequest, User | ApiError>('/api/profile', async ({ request }) => {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    const parsed = profileSchema.safeParse({ ...toPublicUser(auth.user), ...(await request.json()) })
    if (!parsed.success) return validationError(parsed.error)

    const { name, email, username, ensName, walletNickname, avatarUrl } = parsed.data
    const others = db.users.filter((u) => u.id !== auth.user.id)
    if (others.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      const msg = 'Este e-mail já está em uso.'
      return apiError(409, 'CONFLICT', msg, { email: msg })
    }
    if (others.some((u) => u.username === username)) {
      const msg = 'Este nome de usuário já está em uso.'
      return apiError(409, 'CONFLICT', msg, { username: msg })
    }
    if (others.some((u) => u.ensName === ensName)) {
      const msg = 'Este nome ENS já pertence a outro colecionador.'
      return apiError(409, 'CONFLICT', msg, { ensName: msg })
    }

    Object.assign(auth.user, { name, email, username, ensName, walletNickname, avatarUrl: avatarUrl ?? null })
    persist()
    return HttpResponse.json(toPublicUser(auth.user))
  }),

  http.post<PathParams, ChangePasswordRequest, { ok: true } | ApiError>('/api/profile/password', async ({ request }) => {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    const parsed = changePasswordSchema.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const { currentPassword, newPassword } = parsed.data
    if (auth.user.passwordHash !== (await hashPassword(currentPassword))) {
      const msg = 'Senha atual incorreta.'
      return apiError(422, 'VALIDATION_ERROR', msg, { currentPassword: msg })
    }
    if (currentPassword === newPassword) {
      const msg = 'A nova senha deve ser diferente da atual.'
      return apiError(422, 'VALIDATION_ERROR', msg, { newPassword: msg })
    }

    auth.user.passwordHash = await hashPassword(newPassword)
    persist()
    return HttpResponse.json({ ok: true })
  }),

  http.post<PathParams, UpsertWalletRequest, Wallet | ApiError>('/api/wallets', async ({ request }) => {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    const parsed = walletSchema.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const wallets = db.wallets[auth.user.id] ?? []
    if (wallets.length >= 2) return apiError(409, 'CONFLICT', 'Você já tem carteira principal e secundária.')
    const conflict = checkWalletConflicts(wallets, parsed.data)
    if (conflict) return conflict

    const wallet: Wallet = { id: nextId('wal'), ...parsed.data, ens: parsed.data.ens ?? null }
    db.wallets[auth.user.id] = [...wallets, wallet]
    persist()
    return HttpResponse.json(wallet, { status: 201 })
  }),

  http.put<{ walletId: string }, UpsertWalletRequest, Wallet | ApiError>('/api/wallets/:walletId', async ({ request, params }) => {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    const wallets = db.wallets[auth.user.id] ?? []
    const wallet = wallets.find((w) => w.id === params.walletId)
    if (!wallet) return apiError(404, 'NOT_FOUND', 'Carteira não encontrada.')

    const parsed = walletSchema.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)
    const conflict = checkWalletConflicts(wallets.filter((w) => w.id !== wallet.id), parsed.data)
    if (conflict) return conflict

    Object.assign(wallet, parsed.data, { ens: parsed.data.ens ?? null })
    persist()
    return HttpResponse.json(wallet)
  }),

  // Atividade e Arquivos baixados: só os pedidos do próprio usuário, do mais recente ao mais antigo
  http.get<PathParams, DefaultBodyType, Order[] | ApiError>('/api/orders', ({ request }) => {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    const orders = Object.values(db.orders)
      .filter((o) => o.userId === auth.user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    orders.forEach(settleIfDue)
    return HttpResponse.json(orders.map(toPublicOrder))
  }),

  // Ofertas: cupons públicos (a validade é conferida de novo ao aplicar no carrinho)
  http.get<PathParams, DefaultBodyType, CouponOffer[]>('/api/coupons', () =>
    HttpResponse.json(
      db.coupons.map(({ code, percentOff, expiresAt }) => ({
        code,
        percentOff,
        expiresAt,
        expired: new Date(expiresAt).getTime() <= Date.now(),
      })),
    ),
  ),

  http.post<PathParams, SupportRequest, SupportTicket | ApiError>('/api/support', async ({ request }) => {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    const parsed = supportSchema.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const orderId = parsed.data.orderId || null
    if (orderId && db.orders[orderId]?.userId !== auth.user.id) {
      const msg = 'Pedido não encontrado.'
      return apiError(422, 'VALIDATION_ERROR', msg, { orderId: msg })
    }

    const ticket: SupportTicket = {
      protocol: nextId('SUP').toUpperCase(),
      topic: parsed.data.topic,
      createdAt: new Date().toISOString(),
    }
    db.supportTickets.push({ ...ticket, userId: auth.user.id, message: parsed.data.message, orderId })
    persist()
    return HttpResponse.json(ticket, { status: 201 })
  }),
]

function checkWalletConflicts(others: Wallet[], data: UpsertWalletRequest) {
  if (others.some((w) => w.role === data.role)) {
    const msg = data.role === 'primary' ? 'Você já tem uma carteira principal.' : 'Você já tem uma carteira secundária.'
    return apiError(409, 'CONFLICT', msg, { role: msg })
  }
  if (others.some((w) => w.address.toLowerCase() === data.address.toLowerCase())) {
    const msg = 'Este endereço já está cadastrado.'
    return apiError(409, 'CONFLICT', msg, { address: msg })
  }
  return null
}
