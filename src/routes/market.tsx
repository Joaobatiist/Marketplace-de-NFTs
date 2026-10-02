import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { allNftsQueryOptions } from '@/features/market/queries'
import { categoryStats, collectionStats, marketSummary } from '@/features/market/stats'
import { CategoryList, CollectionList, MarketSkeleton, MarketStats } from '@/features/market/components/market-overview'
import { NftGrid } from '@/features/catalog/components/nft-grid'
import { toApiError } from '@/lib/http'
import { ErrorState } from '@/components/feedback/error-state'

export const Route = createFileRoute('/market')({
  loader: ({ context: { queryClient } }) => void queryClient.prefetchQuery(allNftsQueryOptions),
  component: MarketPage,
})

function MarketPage() {
  const list = useQuery(allNftsQueryOptions)

  function renderContent() {
    if (list.isPending) return <MarketSkeleton />
    if (!list.data) return <ErrorState message={toApiError(list.error).message} onRetry={() => void list.refetch()} />

    const nfts = list.data.items
    return (
      <>
        <MarketStats summary={marketSummary(nfts)} />

        <section aria-labelledby="market-collections" className="space-y-4">
          <h2 id="market-collections" className="text-xl font-bold">Coleções</h2>
          <CollectionList collections={collectionStats(nfts)} />
        </section>

        <section aria-labelledby="market-categories" className="space-y-4">
          <h2 id="market-categories" className="text-xl font-bold">Categorias</h2>
          <CategoryList categories={categoryStats(nfts)} />
        </section>

        <section aria-labelledby="market-recent" className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 id="market-recent" className="text-xl font-bold">Listados recentemente</h2>
            <Link to="/" className="rounded-sm text-sm text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              Ver catálogo completo
            </Link>
          </div>
          <NftGrid nfts={nfts.slice(0, 6)} />
        </section>
      </>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Mercado</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Panorama do marketplace: coleções, categorias, preços mínimos e estoque, atualizados em tempo real.
        </p>
      </div>
      {renderContent()}
    </div>
  )
}
