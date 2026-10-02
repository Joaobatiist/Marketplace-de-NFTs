import type { EthAmount, Nft, NftCategory } from '@/contracts'
import { NFT_CATEGORIES } from '@/contracts'
import { toDecimal } from '@/lib/eth'

export interface GroupStats {
  /** NFTs do grupo */
  items: number
  /** unidades ainda à venda, somando todas as edições */
  available: number
  /** menor preço entre as edições com estoque; null se tudo esgotou */
  floor: EthAmount | null
}

export interface CollectionStats extends GroupStats {
  name: string
}

export interface CategoryStats extends GroupStats {
  category: NftCategory
}

export interface CreatorStats extends GroupStats {
  name: string
  avatarUrl: string
  collections: string[]
  /** até 3 obras, das mais recentes para as mais antigas */
  works: Nft[]
}

function summarize(nfts: Nft[]): GroupStats {
  const onSale = nfts.flatMap((n) => n.editions).filter((e) => e.available > 0)
  const floor = onSale.length
    ? onSale.map((e) => toDecimal(e.price)).reduce((min, p) => (p.lessThan(min) ? p : min)).toString()
    : null
  return { items: nfts.length, available: onSale.reduce((sum, e) => sum + e.available, 0), floor }
}

function groupBy<K>(nfts: Nft[], key: (nft: Nft) => K) {
  const groups = new Map<K, Nft[]>()
  for (const nft of nfts) groups.set(key(nft), [...(groups.get(key(nft)) ?? []), nft])
  return groups
}

export const marketSummary = (nfts: Nft[]) => ({
  ...summarize(nfts),
  collections: new Set(nfts.map((n) => n.collection)).size,
})

export const collectionStats = (nfts: Nft[]): CollectionStats[] =>
  [...groupBy(nfts, (n) => n.collection)]
    .map(([name, group]) => ({ name, ...summarize(group) }))
    .sort((a, b) => a.name.localeCompare(b.name))

/** na ordem do filtro do catálogo; categorias sem NFT ficam de fora */
export const categoryStats = (nfts: Nft[]): CategoryStats[] => {
  const groups = groupBy(nfts, (n) => n.category)
  return NFT_CATEGORIES.filter((c) => groups.has(c)).map((category) => ({ category, ...summarize(groups.get(category)!) }))
}

export const creatorStats = (nfts: Nft[]): CreatorStats[] =>
  [...groupBy(nfts, (n) => n.creator.name)]
    .map(([name, group]) => ({
      name,
      avatarUrl: group[0].creator.avatarUrl,
      collections: [...new Set(group.map((n) => n.collection))].sort(),
      works: [...group].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3),
      ...summarize(group),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
