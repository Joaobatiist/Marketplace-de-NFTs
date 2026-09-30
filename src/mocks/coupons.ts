import type { Coupon } from './db'

export const seedCoupons: Coupon[] = [
  { code: 'JUNGLE10', percentOff: 10, expiresAt: '2099-12-31T23:59:59.000Z' },
  { code: 'EXPIRADO', percentOff: 20, expiresAt: '2020-01-01T00:00:00.000Z' },
]