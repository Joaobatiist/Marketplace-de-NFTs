import { useId, type ReactNode } from 'react'
import type { Network, Quote } from '@/contracts'
import { cn } from '@/lib/utils'
import { NETWORK_LABELS } from '../format'
import { OrderLines, OrderLinesSkeleton, OrderTotals, OrderTotalsSkeleton } from './order-summary'

interface OrderReviewProps {
  quote: Quote | undefined
  isLoading: boolean
  /** refetch com dados na tela: mantém o conteúdo, esmaecido, e marca aria-busy */
  isUpdating: boolean
  buyer: { name: string; email: string }
  walletLabel: string
  network: Network
}

export function OrderReview({ quote, isLoading, isUpdating, buyer, walletLabel, network }: OrderReviewProps) {
  const titleId = useId()

  return (
    <section
      aria-labelledby={titleId}
      aria-busy={isLoading || isUpdating}
      className={cn('space-y-6 transition-opacity motion-reduce:transition-none', isUpdating && 'opacity-60')}
    >
      <h2 id={titleId} className="text-lg font-semibold">
        Revisão do pedido
      </h2>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6 rounded-xl bg-card p-5">
          <h3 className="font-semibold">Seus NFTs</h3>
          {isLoading ? (
            <>
              <span role="status" className="sr-only">
                Carregando cotação…
              </span>
              <OrderLinesSkeleton />
            </>
          ) : quote ? (
            <OrderLines lines={quote.lines} caption="Itens do pedido" />
          ) : (
            <p className="text-sm text-muted-foreground">Não foi possível carregar os itens. Volte e tente novamente.</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-card p-5">
            <h3 className="mb-4 font-semibold">Resumo</h3>
            {isLoading ? (
              <OrderTotalsSkeleton estimated />
            ) : quote ? (
              <OrderTotals
                subtotal={quote.subtotal}
                discount={quote.discount}
                networkFee={quote.networkFee}
                total={quote.total}
                couponCode={quote.coupon?.code ?? null}
                estimated
              />
            ) : (
              <p className="text-sm text-muted-foreground">Cotação indisponível.</p>
            )}
          </div>

          <dl className="space-y-4 rounded-xl bg-card p-5 text-sm">
            <Detail label="Colecionador">
              <span className="block font-medium">{buyer.name}</span>
              <span className="block break-all text-muted-foreground">{buyer.email}</span>
            </Detail>
            <Detail label="Carteira">{walletLabel || '—'}</Detail>
            <Detail label="Rede">{NETWORK_LABELS[network]}</Detail>
          </dl>
        </div>
      </div>
    </section>
  )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  )
}
