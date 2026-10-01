import Decimal from 'decimal.js'
import type { Network, QuoteIssue, QuoteLine } from '@/contracts'
import { db, findEdition, findNft, nextId, persist, type StoredQuote } from './db'

const NETWORK_FEES: Record<Network, string> = {
  ethereum: '0.0021',
  polygon: '0.0001',
  base: '0.0003',
}
const QUOTE_TTL_MS = 5 * 60 * 1000

export function findValidCoupon(code: string | undefined) {
  if (!code) return null
  const coupon = db.coupons.find((c) => c.code === code)
  return coupon && new Date(coupon.expiresAt).getTime() > Date.now() ? coupon : null
}

export function buildQuote(ownerKey: string, network: Network): StoredQuote {
  const issues: QuoteIssue[] = []
  const lines: QuoteLine[] = []

  for (const item of db.carts[ownerKey] ?? []) {
    const nft = findNft(item.nftId)
    const edition = findEdition(item.nftId, item.editionId)
    if (!nft || !edition) continue

    if (!new Decimal(edition.price).eq(item.priceSeen)) {
      issues.push({
        type: 'PRICE_CHANGED',
        nftId: nft.id,
        editionId: edition.id,
        oldPrice: item.priceSeen,
        newPrice: edition.price,
      })
    }

    const limit = Math.min(edition.available, edition.maxPerOrder)
    if (limit === 0) {
      issues.push({ type: 'OUT_OF_STOCK', nftId: nft.id, editionId: edition.id })
      continue
    }
    if (item.quantity > limit) {
      issues.push({ type: 'QUANTITY_REDUCED', nftId: nft.id, editionId: edition.id, available: limit })
    }

    const quantity = Math.min(item.quantity, limit)
    lines.push({
      nftId: nft.id,
      editionId: edition.id,
      name: `${nft.name} · ${edition.name}`,
      quantity,
      unitPrice: edition.price,
      lineTotal: new Decimal(edition.price).times(quantity).toString(),
    })
  }

  const subtotal = lines.reduce((sum, l) => sum.plus(l.lineTotal), new Decimal(0))
  const coupon = findValidCoupon(db.cartCoupons[ownerKey])
  const discount = coupon
    ? subtotal.times(coupon.percentOff).div(100).toDecimalPlaces(6, Decimal.ROUND_DOWN)
    : new Decimal(0)
  const networkFee = lines.length > 0 ? new Decimal(NETWORK_FEES[network]) : new Decimal(0)

  // remove cotações vencidas para o storage não crescer sem limite
  const now = Date.now()
  for (const [id, q] of Object.entries(db.quotes)) {
    if (new Date(q.expiresAt).getTime() < now) delete db.quotes[id]
  }

  const quote: StoredQuote = {
    id: nextId('qt'),
    userId: ownerKey,
    lines,
    subtotal: subtotal.toString(),
    discount: discount.toString(),
    networkFee: networkFee.toString(),
    total: subtotal.minus(discount).plus(networkFee).toString(),
    coupon: coupon ? { code: coupon.code, percentOff: coupon.percentOff } : null,
    network,
    expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
    issues,
  }
  db.quotes[quote.id] = quote
  persist()
  return quote
}
