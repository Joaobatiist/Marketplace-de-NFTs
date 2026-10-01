import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { nftDetailQueryOptions } from '@/features/catalog/queries'
import { toApiError } from '@/lib/http'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { NftGallery } from '@/features/nft/components/nft-gallery'
import { NftInfo } from '@/features/nft/components/nft-info'
import { PurchasePanel } from '@/features/nft/components/purchase-panel'
import { NftDetailSkeleton } from '@/features/nft/components/nft-detail-skeleton'
import { FavoriteToggle } from '@/features/favorites/components/favorite-toggle'
import type { Nft } from '@/contracts'

export const Route = createFileRoute('/nfts/$nftId')({
  loader: ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(nftDetailQueryOptions(params.nftId))
  },
  component: NftDetailPage,
})

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const navigate = useNavigate()
  const query = useQuery(nftDetailQueryOptions(nftId))

  if (query.isPending) return <NftDetailSkeleton />

  if (!query.data) {
    const error = toApiError(query.error)
    if (error.code === 'NOT_FOUND') {
      return (
        <EmptyState
          title="NFT não encontrado"
          description="Ele pode ter sido removido ou o link está incorreto."
          actionLabel="Voltar ao catálogo"
          onAction={() => void navigate({ to: '/' })}
        />
      )
    }
    return <ErrorState message={error.message} onRetry={() => void query.refetch()} />
  }

  // key: ao navegar de um NFT para outro, a edição e a quantidade escolhidas reiniciam
  return <NftDetail key={nftId} nft={query.data} />
}

function NftDetail({ nft }: { nft: Nft }) {
  const [editionId, setEditionId] = useState(
    () => (nft.editions.find((e) => e.available > 0) ?? nft.editions[0]).id,
  )
  const [quantity, setQuantity] = useState(1)

  // a edição é lida dos dados atuais: se o estoque mudar (socket, passo 12), a tela reflete
  const edition = nft.editions.find((e) => e.id === editionId) ?? nft.editions[0]
  const maxQuantity = Math.min(edition.available, edition.maxPerOrder)
  const safeQuantity = Math.min(Math.max(quantity, 1), Math.max(maxQuantity, 1))

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-2">
      <NftGallery images={nft.images} name={nft.name} />
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <NftInfo nft={nft} />
          <FavoriteToggle nftId={nft.id} nftName={nft.name} />
        </div>
        <PurchasePanel
          editions={nft.editions}
          selectedEditionId={edition.id}
          onEditionChange={(id) => {
            setEditionId(id)
            setQuantity(1)
          }}
          quantity={safeQuantity}
          maxQuantity={maxQuantity}
          onQuantityChange={setQuantity}
          // onAddToCart é ligado no passo 10
        />
      </div>
    </div>
  )
}