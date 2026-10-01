import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { orderQueryOptions } from '@/features/checkout/queries'
import { toApiError } from '@/lib/http'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { OrderReceipt, OrderReceiptSkeleton } from '@/features/checkout/components/order-receipt'
import { OrderStatusView } from '@/features/checkout/components/order-status-view'

export const Route = createFileRoute('/_auth/orders/$orderId')({ component: OrderPage })

function OrderPage() {
  const { orderId } = Route.useParams()
  const { session } = Route.useRouteContext()
  const navigate = useNavigate()
  const order = useQuery(orderQueryOptions(session.user.id, orderId))

  if (order.isPending) return <OrderReceiptSkeleton />

  if (!order.data) {
    const error = toApiError(order.error)
    if (error.code === 'NOT_FOUND') {
      return <EmptyState title="Pedido não encontrado" actionLabel="Ver catálogo" onAction={() => void navigate({ to: '/' })} />
    }
    return <ErrorState message={error.message} onRetry={() => void order.refetch()} />
  }

  // o recibo só existe para pedido efetivamente confirmado
  if (order.data.status !== 'confirmed') {
    return (
      <OrderStatusView
        status={order.data.status}
        declineReason={order.data.declineReason}
        onRetry={() => void navigate({ to: '/checkout' })}
        onBackToCart={() => void navigate({ to: '/cart' })}
      />
    )
  }

  return <OrderReceipt order={order.data} />
}
