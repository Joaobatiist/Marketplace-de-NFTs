import { http } from '@/lib/http'
import type { ChangePasswordRequest, UpdateProfileRequest, User } from '@/contracts'

export const accountApi = {
  update: (body: UpdateProfileRequest) => http.patch<User>('/profile', body).then((r) => r.data),
  changePassword: (body: ChangePasswordRequest) => http.post('/profile/password', body),
}
