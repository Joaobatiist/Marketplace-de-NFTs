import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import { CircleCheck, CircleX, Clock, type LucideIcon } from 'lucide-react'
import type { Order, OrderStatus } from '@/contracts'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, NETWORK_LABELS } from '@/features/checkout/format'

const STATUS: Record<OrderStatus, { label: string; icon: LucideIcon; className: string }> = {
  pending: { label: 'Processando', icon: Clock, className: 'border-primary/50 text-primary' },
  confirmed: { label: 'Confirmado', icon: CircleCheck, className: 'border-primary bg-primary/15 text-primary' },
  declined: { label: 'Recusado', icon: CircleX, className: 'border-destructive/60 text-destructive' },
}

/** status com ícone + texto (não depende só da cor) */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, icon: Icon, className } = STATUS[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold', className)}>
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  )
}

const itemsSummary = (order: Order) => order.lines.map((l) => (l.quantity > 1 ? `${l.name} × ${l.quantity}` : l.name)).join(', ')

/** uma compra na tela Atividade: número, data, itens, total, rede, status e link para o recibo */
export function OrderRow({ order }: { order: Order }) {
  const titleId = useId()

  return (
    <article aria-labelledby={titleId} className="grid gap-4 rounded-[3px] border border-border p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id={titleId} className="font-bold">
            Pedido {order.id}
          </h2>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-xs text-muted-foreground">
          <time dateTime={order.createdAt}>{formatDateTime(order.createdAt)}</time> · {NETWORK_LABELS[order.network]}
        </p>
        <p className="truncate text-sm">{itemsSummary(order)}</p>
      </div>
      <div className="flex items-center justify-between gap-6 md:flex-col md:items-end md:gap-2">
        <p className="font-bold text-primary">
          <span className="sr-only">Total: </span>
          {formatEth(order.total, 6)}
        </p>
        <Link
          to="/orders/$orderId"
          params={{ orderId: order.id }}
          aria-describedby={titleId}
          className="rounded-sm text-sm font-bold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {order.status === 'pending' ? 'Acompanhar' : 'Ver recibo'}
        </Link>
      </div>
    </article>
  )
}

export function OrderRowSkeleton() {
  return <Skeleton className="h-[7.5rem] rounded-[3px] md:h-[6.25rem]" />
}
