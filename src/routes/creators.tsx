import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { allNftsQueryOptions } from '@/features/market/queries'
import { creatorStats } from '@/features/market/stats'
import { CreatorCard, CreatorCardSkeleton } from '@/features/market/components/creator-card'
import { toApiError } from '@/lib/http'
import { ErrorState } from '@/components/feedback/error-state'

export const Route = createFileRoute('/creators')({
  loader: ({ context: { queryClient } }) => void queryClient.prefetchQuery(allNftsQueryOptions),
  component: CreatorsPage,
})

const gridClass = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4'

function CreatorsPage() {
  const list = useQuery(allNftsQueryOptions)

  function renderContent() {
    if (list.isPending) {
      return (
        <div role="status">
          <span className="sr-only">Carregando criadores…</span>
          <div aria-hidden="true" className={gridClass}>
            {Array.from({ length: 4 }, (_, i) => (
              <CreatorCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )
    }
    if (!list.data) return <ErrorState message={toApiError(list.error).message} onRetry={() => void list.refetch()} />

    return (
      <ul className={gridClass}>
        {creatorStats(list.data.items).map((creator) => (
          <li key={creator.name}>
            <CreatorCard creator={creator} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Criadores</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Os artistas por trás das coleções da Kurio. Veja as obras mais recentes de cada um e explore o catálogo completo.
        </p>
      </div>
      {renderContent()}
    </div>
  )
}
