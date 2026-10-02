import type { QueryClient } from '@tanstack/react-query'
import type { Cart, Nft, NftUpdatedEvent, Order, OrderUpdatedEvent, Paginated } from '@/contracts'
import { nftKeys } from '@/features/catalog/queries'
import { cartKeys } from '@/features/cart/queries'
import { toDecimal } from '@/lib/eth'

const seen = new Set<string>()
const MAX_SEEN = 500

/** true se o evento é novo; false se já foi processado (duplicata) */
export function markSeen(eventId: string) {
  if (seen.has(eventId)) return false
  seen.add(eventId)
  if (seen.size > MAX_SEEN) seen.delete(seen.values().next().value!)
  return true
}

export function resetSeen() {
  seen.clear()
}

function patchNft(nft: Nft, event: NftUpdatedEvent): Nft {
  if (event.version <= nft.version) return nft // evento antigo: nunca regride o estado
  return {
    ...nft,
    version: event.version,
    editions: nft.editions.map((edition) => {
      const update = event.payload.editions.find((u) => u.editionId === edition.id)
      return update ? { ...edition, price: update.price, available: update.available } : edition
    }),
  }
}

/** atualiza catálogo, destaques e detalhe; se o NFT está no carrinho, ressincroniza carrinho e cotação */
export function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent, owner: string) {
  const patch = (nft: Nft) => (nft.id === event.resourceId ? patchNft(nft, event) : nft)

  queryClient.setQueryData<Nft>(nftKeys.detail(event.resourceId), (old) => old && patchNft(old, event))
  queryClient.setQueriesData<Paginated<Nft>>({ queryKey: nftKeys.lists() }, (old) =>
    old ? { ...old, items: old.items.map(patch) } : old,
  )
  queryClient.setQueryData<Nft[]>(nftKeys.featured(), (old) => old?.map(patch))

  const cart = queryClient.getQueryData<Cart>(cartKeys.cart(owner))
  const affected = cart?.items.filter((item) => item.nftId === event.resourceId) ?? []
  if (affected.length === 0) return null

  void queryClient.invalidateQueries({ queryKey: cartKeys.cart(owner) })
  void queryClient.invalidateQueries({ queryKey: cartKeys.quotes(owner) })

  // só avisa se a mudança realmente afeta o carrinho (preço diferente ou estoque insuficiente)
  const relevant = affected.find((item) => {
    const update = event.payload.editions.find((u) => u.editionId === item.editionId)
    return update && (!toDecimal(update.price).eq(item.unitPrice) || update.available < item.quantity)
  })
  return relevant?.name ?? null
}

export function applyOrderUpdated(queryClient: QueryClient, event: OrderUpdatedEvent, userId: string) {
  const key = ['order', userId, event.resourceId] as const
  const current = queryClient.getQueryData<Order>(key)
  if (current && event.version <= current.version) return

  if (current) {
    queryClient.setQueryData<Order>(key, {
      ...current,
      ...event.payload,
      version: event.version,
    })
  }
  // busca o pedido completo (o recibo precisa de explorerUrl e demais campos)
  void queryClient.invalidateQueries({ queryKey: key })
}
