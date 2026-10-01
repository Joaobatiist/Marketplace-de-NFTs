import type { Network, Wallet } from '@/contracts'

export const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  base: 'Base',
}

export const WALLET_ROLE_LABELS: Record<Wallet['role'], string> = {
  primary: 'Principal',
  secondary: 'Secundária',
}

/** 0x1111111111111111111111111111111111111111 → 0x1111…1111 */
export function shortenHex(value: string, start = 6, end = 4) {
  return value.length <= start + end + 1 ? value : `${value.slice(0, start)}…${value.slice(-end)}`
}

const longFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })
const shortFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/** longo: "1 de out. de 2026, 14:30"; curto (telas estreitas): "01/10/2026, 14:30" */
export function formatDateTime(iso: string, style: 'long' | 'short' = 'long') {
  return (style === 'long' ? longFormatter : shortFormatter).format(new Date(iso))
}
