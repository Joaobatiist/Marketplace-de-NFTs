export type EthAmount = string

export type ISODate = string

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'SESSION_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'OUT_OF_STOCK'
  | 'COUPON_INVALID'
  | 'COUPON_EXPIRED'
  | 'QUOTE_OUTDATED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'SERVICE_UNAVAILABLE'
  | 'WALLET_REJECTED'

export interface ApiError {
  code: ApiErrorCode
  message: string
  fieldErrors?: Record<string, string>
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}