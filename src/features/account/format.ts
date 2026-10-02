import type { SupportTopic } from '@/contracts'

export const SUPPORT_TOPIC_LABELS: Record<SupportTopic, string> = {
  order: 'Pedido ou recibo',
  payment: 'Pagamento',
  wallet: 'Carteira',
  account: 'Conta e acesso',
  other: 'Outro assunto',
}
