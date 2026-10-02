import { http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw'
import { loginSchema, registerRequestSchema, type ApiError, type AuthResponse, type Session } from '@/contracts'
import { db, hashPassword, nextId, persist, type StoredUser } from '../db'
import {
  apiError, createSession, mergeGuestCart, requireAuth, toSession, validationError,
} from '../utils'

const slug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')

/** identificador a partir do "Nome de usuário" do cadastro (ou do e-mail), 3–20 caracteres, sufixo se já existir */
function uniqueUsername(name: string, email: string) {
  const base = (slug(name) || slug(email.split('@')[0]) || 'colecionador').padEnd(3, '0').slice(0, 16)
  let candidate = base
  for (let n = 2; db.users.some((u) => u.username === candidate); n++) candidate = `${base}${n}`
  return candidate
}

// o MSW deduz o tipo da resposta pelo primeiro `return`; quando o handler devolve sucesso OU erro,
// declare os dois no 3º genérico: http.post<PathParams, DefaultBodyType, Sucesso | ApiError>
export const authHandlers = [
  http.post<PathParams, DefaultBodyType, AuthResponse | ApiError>('/api/auth/register', async ({ request }) => {
    const parsed = registerRequestSchema.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const { name, email, password } = parsed.data
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      const msg = 'Este e-mail já está cadastrado.'
      return apiError(409, 'CONFLICT', msg, { email: msg })
    }

    const id = nextId('usr')
    const username = uniqueUsername(name, email)
    const user: StoredUser = {
      id,
      name,
      email,
      avatarUrl: null,
      // o cadastro só pede nome, e-mail e senha: o resto do perfil nasce com valores editáveis
      username,
      ensName: `${username.replace(/[._]/g, '-')}.eth`,
      walletNickname: 'Minha carteira',
      passwordHash: await hashPassword(password),
    }
    db.users.push(user)
    db.wallets[user.id] = []
    mergeGuestCart(request.headers.get('X-Guest-Id'), user.id)
    const session = createSession(user.id)
    persist()

    return HttpResponse.json<AuthResponse>(
      { token: session.token, session: toSession(user, session) },
      { status: 201 },
    )
  }),

  http.post<PathParams, DefaultBodyType, AuthResponse | ApiError>('/api/auth/login', async ({ request }) => {
    const parsed = loginSchema.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const { email, password } = parsed.data
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!user || user.passwordHash !== (await hashPassword(password))) {
      return apiError(401, 'UNAUTHORIZED', 'E-mail ou senha inválidos.')
    }

    mergeGuestCart(request.headers.get('X-Guest-Id'), user.id)
    const session = createSession(user.id)
    persist()

    return HttpResponse.json<AuthResponse>({ token: session.token, session: toSession(user, session) })
  }),

  http.get<PathParams, DefaultBodyType, Session | ApiError>('/api/auth/session', ({ request }) => {
    const auth = requireAuth(request)
    if ('error' in auth) return auth.error
    return HttpResponse.json<Session>(toSession(auth.user, auth.session))
  }),

  http.post('/api/auth/logout', ({ request }) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    db.sessions = db.sessions.filter((s) => s.token !== token)
    persist()
    return new HttpResponse(null, { status: 204 })
  }),

  // apoio para testes e demonstração: força expiração de todas as sessões
  http.post('/api/__dev/expire-sessions', () => {
    db.sessions.forEach((s) => (s.expiresAt = new Date(0).toISOString()))
    persist()
    return new HttpResponse(null, { status: 204 })
  }),
]