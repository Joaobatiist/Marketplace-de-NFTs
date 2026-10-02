import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ordersQueryOptions } from '@/features/account/queries'
import { AccountHeading } from '@/features/account/components/account-heading'
import { OrderRow, OrderRowSkeleton } from '@/features/account/components/order-row'
import { toApiError } from '@/lib/http'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'

export const Route = createFileRoute('/_auth/_account/activity')({ component: ActivityPage })

function ActivityPage() {
  const { session } = Route.useRouteContext()
  const navigate = Route.useNavigate()
  const orders = useQuery(ordersQueryOptions(session.user.id))

  function renderContent() {
    if (orders.isPending) {
      return (
        <div role="status" className="space-y-4">
          <span className="sr-only">Carregando compras…</span>
          <OrderRowSkeleton />
          <OrderRowSkeleton />
        </div>
      )
    }
    if (!orders.data) return <ErrorState message={toApiError(orders.error).message} onRetry={() => void orders.refetch()} />
    if (orders.data.length === 0) {
      return (
        <EmptyState
          title="Nenhuma compra ainda"
          description="Quando você comprar um NFT, o pedido e o status do pagamento aparecem aqui."
          actionLabel="Explorar o catálogo"
          onAction={() => void navigate({ to: '/' })}
        />
      )
    }
    return (
      <ul className="space-y-4">
        {orders.data.map((order) => (
          <li key={order.id}>
            <OrderRow order={order} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="space-y-8">
      <AccountHeading title="Atividade" description="Suas compras, da mais recente para a mais antiga, com o status do pagamento." />
      {renderContent()}
    </div>
  )
}
