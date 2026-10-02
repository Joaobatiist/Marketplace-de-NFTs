import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ordersQueryOptions } from '@/features/account/queries'
import { allNftsQueryOptions } from '@/features/market/queries'
import { AccountHeading } from '@/features/account/components/account-heading'
import { DownloadRow, DownloadRowSkeleton, type DownloadItem } from '@/features/account/components/download-row'
import { toApiError } from '@/lib/http'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'

export const Route = createFileRoute('/_auth/_account/downloads')({ component: DownloadsPage })

function DownloadsPage() {
  const { session } = Route.useRouteContext()
  const navigate = Route.useNavigate()
  const orders = useQuery(ordersQueryOptions(session.user.id))
  const catalog = useQuery(allNftsQueryOptions)

  function renderContent() {
    if (orders.isPending || catalog.isPending) {
      return (
        <div role="status" className="space-y-3">
          <span className="sr-only">Carregando arquivos…</span>
          <DownloadRowSkeleton />
          <DownloadRowSkeleton />
        </div>
      )
    }
    if (!orders.data || !catalog.data) {
      return (
        <ErrorState
          message={toApiError(orders.error ?? catalog.error).message}
          onRetry={() => void Promise.all([orders.refetch(), catalog.refetch()])}
        />
      )
    }

    // só compras confirmadas liberam o arquivo; a imagem vem do catálogo atual
    const images = new Map(catalog.data.items.map((n) => [n.id, n.images[0]]))
    const items: DownloadItem[] = orders.data
      .filter((o) => o.status === 'confirmed')
      .flatMap((o) =>
        o.lines.map((l) => ({
          key: `${o.id}:${l.editionId}`,
          nftId: l.nftId,
          name: l.name,
          quantity: l.quantity,
          orderId: o.id,
          purchasedAt: o.createdAt,
          fileUrl: images.get(l.nftId),
        })),
      )

    if (items.length === 0) {
      return (
        <EmptyState
          title="Nenhum arquivo ainda"
          description="Os arquivos das obras ficam disponíveis aqui assim que a compra é confirmada."
          actionLabel="Explorar o catálogo"
          onAction={() => void navigate({ to: '/' })}
        />
      )
    }
    return (
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.key}>
            <DownloadRow item={item} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="space-y-8">
      <AccountHeading title="Arquivos baixados" description="Os arquivos das obras que você comprou, prontos para baixar." />
      {renderContent()}
    </div>
  )
}
