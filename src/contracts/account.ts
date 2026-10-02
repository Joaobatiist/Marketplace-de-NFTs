import type { ISODate } from './common'

/** cupom público (tela Ofertas) */
export interface CouponOffer {
  code: string
  percentOff: number
  expiresAt: ISODate
  /** calculado pelo servidor no momento da resposta */
  expired: boolean
}

export const SUPPORT_TOPICS = ['order', 'payment', 'wallet', 'account', 'other'] as const
export type SupportTopic = (typeof SUPPORT_TOPICS)[number]

export interface SupportRequest {
  topic: SupportTopic
  orderId?: string | null
  message: string
}

export interface SupportTicket {
  protocol: string
  topic: SupportTopic
  createdAt: ISODate
}
