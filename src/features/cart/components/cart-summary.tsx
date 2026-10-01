import { useId, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import type { Quote } from '@/contracts'
import { formatEth, toDecimal } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface CartSummaryProps {
  quote: Quote | undefined
  isLoading: boolean
  isUpdating: boolean
  error?: string
  onRetry: () => void
  checkoutDisabled: boolean
  checkoutDisabledReason?: string
  onCheckout: () => void
}

export function CartSummary({
  quote,
  isLoading,
  isUpdating,
  error,
  onRetry,
  checkoutDisabled,
  checkoutDisabledReason,
  onCheckout,
}: CartSummaryProps) {
  const id = useId()
  const hasDiscount = !!quote && toDecimal(quote.discount).greaterThan(0)

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-4 rounded-xl bg-card p-5">
      <h2 id={`${id}-title`} className="border-b pb-3 font-bold">
        Resumo do pedido
      </h2>

      {isLoading ? (
        <div role="status">
          <span className="sr-only">Calculando valores…</span>
          <SummarySkeleton />
        </div>
      ) : error && !quote ? (
        <div role="alert" className="space-y-3 text-sm">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        </div>
      ) : quote ? (
        <div aria-busy={isUpdating} className={cn('space-y-3 text-sm transition-opacity motion-reduce:transition-none', isUpdating && 'opacity-60')}>
          <dl className="space-y-2">
            <Row label="Subtotal">{formatEth(quote.subtotal)}</Row>
            {hasDiscount && (
              <Row label={`Desconto${quote.coupon ? ` (${quote.coupon.code})` : ''}`}>
                <span className="text-primary">
                  <span aria-hidden="true">(-) </span>
                  <span className="sr-only">menos </span>
                  {formatEth(quote.discount)}
                </span>
              </Row>
            )}
            <Row label="Taxa de rede estimada">{formatEth(quote.networkFee)}</Row>
          </dl>
          <div aria-live="polite" aria-atomic="true" className="flex items-baseline justify-between border-t pt-3">
            <span className="font-bold">Total</span>
            <span className="text-xl font-bold text-primary">{formatEth(quote.total)}</span>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Button
          size="lg"
          className="w-full font-bold"
          onClick={onCheckout}
          disabled={checkoutDisabled}
          aria-describedby={checkoutDisabled && checkoutDisabledReason ? `${id}-reason` : undefined}
        >
          Ir para pagamento
        </Button>
        {checkoutDisabled && checkoutDisabledReason && (
          <p id={`${id}-reason`} className="text-center text-xs text-destructive">
            {checkoutDisabledReason}
          </p>
        )}
        <Link
          to="/"
          className="block rounded-sm text-center text-sm text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Continuar explorando
        </Link>
      </div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  )
}

/** mesmas alturas das linhas reais (subtotal, taxa, total) */
function SummarySkeleton() {
  return (
    <div aria-hidden="true" className="space-y-3">
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex h-5 items-center justify-between">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        ))}
      </div>
      <div className="flex h-[2.5625rem] items-end justify-between border-t">
        <Skeleton className="mb-1 h-4 w-12" />
        <Skeleton className="mb-1 h-5 w-28" />
      </div>
    </div>
  )
}
