import Decimal from 'decimal.js'
import type { EthAmount, Nft } from '@/contracts'

export const toDecimal = (value: EthAmount) => new Decimal(value)

export function formatEth(value: EthAmount, decimals = 3) {
  return `${toDecimal(value).toDecimalPlaces(decimals).toString()} ETH`
}

/** preço de vitrine: o menor entre as edições */
export function minEditionPrice(nft: Nft): EthAmount {
  return nft.editions
    .map((e) => toDecimal(e.price))
    .reduce((min, p) => (p.lessThan(min) ? p : min))
    .toString()
}

export function isSoldOut(nft: Nft) {
  return nft.editions.every((e) => e.available === 0)
}