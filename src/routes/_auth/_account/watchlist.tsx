import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Nft } from '@/contracts'
import { favoritesQueryOptions, useFavorite } from '@/features/favorites/queries'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { allNftsQueryOptions } from '@/features/market/queries'
import { NftGrid, NftGridSkeleton } from '@/features/catalog/components/nft-grid'
import { AccountHeading } from '@/features/account/components/account-heading'
import { toApiError } from '@/lib/http'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'

export const Route = createFileRoute('/_auth/_account/watchlist')({ component: WatchlistPage })

/** coração do card: desfavoritar tira o NFT da lista na hora (atualização otimista) */
function CardFavorite({ nft }: { nft: Nft }) {
  const { isFavorite, toggle } = useFavorite(nft.id)
  return <FavoriteButton isFavorite={isFavorite} onToggle={toggle} label={nft.name} />
}

function WatchlistPage() {
  const { session } = Route.useRouteContext()
  const navigate = Route.useNavigate()
  const favorites = useQuery(favoritesQueryOptions(session.user.id))
  const catalog = useQuery(allNftsQueryOptions)

  function renderContent() {
    if (favorites.isPending || catalog.isPending) return <NftGridSkeleton count={3} />
    if (!favorites.data || !catalog.data) {
      const error = favorites.error ?? catalog.error
      return (
        <ErrorState
          message={toApiError(error).message}
          onRetry={() => void Promise.all([favorites.refetch(), catalog.refetch()])}
        />
      )
    }

    const ids = new Set(favorites.data)
    const nfts = catalog.data.items.filter((n) => ids.has(n.id))
    if (nfts.length === 0) {
      return (
        <EmptyState
          title="Sua lista de interesse está vazia"
          description="Toque no coração de um NFT para acompanhar preço e disponibilidade por aqui."
          actionLabel="Explorar o catálogo"
          onAction={() => void navigate({ to: '/' })}
        />
      )
    }
    return <NftGrid nfts={nfts} renderCardAction={(nft) => <CardFavorite nft={nft} />} />
  }

  return (
    <div className="space-y-8">
      <AccountHeading
        title="Lista de interesse"
        description="NFTs que você favoritou, com preço e estoque atualizados em tempo real."
      />
      {renderContent()}
    </div>
  )
}
