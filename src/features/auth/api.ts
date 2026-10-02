import { http } from '@/lib/http'
import type { AuthResponse, LoginRequest, RegisterRequest, Session } from '@/contracts'

export const authApi = {
  login: (body: LoginRequest) => http.post<AuthResponse>('/auth/login', body).then((r) => r.data),
  register: (body: RegisterRequest) => http.post<AuthResponse>('/auth/register', body).then((r) => r.data),
  session: () => http.get<Session>('/auth/session').then((r) => r.data),
  logout: () => http.post('/auth/logout'),
}