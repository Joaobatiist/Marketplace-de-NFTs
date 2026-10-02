import { http } from '@/lib/http'
import type {
  ChangePasswordRequest, CouponOffer, Order, SupportRequest, SupportTicket, UpdateProfileRequest, User,
} from '@/contracts'

export const accountApi = {
  update: (body: UpdateProfileRequest) => http.patch<User>('/profile', body).then((r) => r.data),
  changePassword: (body: ChangePasswordRequest) => http.post('/profile/password', body),
  orders: (signal?: AbortSignal) => http.get<Order[]>('/orders', { signal }).then((r) => r.data),
  coupons: (signal?: AbortSignal) => http.get<CouponOffer[]>('/coupons', { signal }).then((r) => r.data),
  support: (body: SupportRequest) => http.post<SupportTicket>('/support', body).then((r) => r.data),
}
