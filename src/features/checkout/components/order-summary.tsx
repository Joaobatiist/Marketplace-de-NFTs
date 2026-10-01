import type { ReactNode } from 'react'
import type { EthAmount, QuoteLine } from '@/contracts'
import { formatEth, toDecimal } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

/** tabela de itens (revisão e recibo); "Unitário" some no mobile para caber em 390px */
export function OrderLines({ lines, caption }: { lines: QuoteLine[]; caption: string }) {
  return (
    <table className="w-full table-fixed text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b text-left text-xs text-muted-foreground">
          <th scope="col" className="pb-2 font-medium">NFT</th>
          <th scope="col" className="w-14 pb-2 text-center font-medium sm:w-20">Qtd.</th>
          <th scope="col" className="hidden w-28 pb-2 text-right font-medium sm:table-cell">Unitário</th>
          <th scope="col" className="w-28 pb-2 text-right font-medium">Total</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={`${line.nftId}-${line.editionId}`} className="border-b border-border/60">
            <th scope="row" className="truncate py-3 pr-2 text-left font-medium">
              {line.name}
            </th>
            <td className="py-3 text-center text-muted-foreground">
              <span aria-hidden="true">(x {line.quantity})</span>
              <span className="sr-only">{line.quantity}</span>
            </td>
            <td className="hidden py-3 text-right text-muted-foreground sm:table-cell">{formatEth(line.unitPrice)}</td>
            <td className="py-3 text-right font-bold text-primary">{formatEth(line.lineTotal)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

interface OrderTotalsProps {
  subtotal: EthAmount
  discount: EthAmount
  networkFee: EthAmount
  total: EthAmount
  /** revisão: código do cupom (null = sem cupom), mostrado numa 2ª linha fixa; recibo: omitir */
  couponCode?: string | null
  /** revisão: a taxa ainda é estimada e o total é anunciado quando a cotação muda */
  estimated?: boolean
}

export function OrderTotals({ subtotal, discount, networkFee, total, couponCode, estimated = false }: OrderTotalsProps) {
  const hasDiscount = toDecimal(discount).greaterThan(0)

  return (
    <div className="space-y-3 text-sm">
      <dl className="space-y-2">
        <Row label="Subtotal">{formatEth(subtotal)}</Row>
        <Row label="Desconto" note={couponCode === undefined ? undefined : couponCode ? `Cupom ${couponCode}` : 'Sem cupom'}>
          <span className={cn(hasDiscount && 'text-primary')}>
            <span aria-hidden="true">(-) </span>
            <span className="sr-only">menos </span>
            {formatEth(discount)}
          </span>
        </Row>
        <Row label="Taxa de rede" note={estimated ? 'Taxa estimada' : undefined}>
          {formatEth(networkFee)}
        </Row>
      </dl>
      <div aria-live={estimated ? 'polite' : undefined} aria-atomic="true" className="flex items-baseline justify-between border-t pt-3">
        <span className="font-bold">Total</span>
        <span className="text-xl font-bold text-primary">{formatEth(total)}</span>
      </div>
    </div>
  )
}

function Row({ label, note, children }: { label: string; note?: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">
        {label}
        {note && <span className="block text-[0.6875rem] leading-4 text-primary">{note}</span>}
      </dt>
      <dd className="text-right">{children}</dd>
    </div>
  )
}

/** skeletons com as mesmas alturas de linha da tabela e do resumo */
export function OrderLinesSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-hidden="true">
      <div className="flex h-[1.5625rem] items-start border-b">
        <Skeleton className="h-3 w-16" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-[2.8125rem] items-center justify-between gap-4 border-b border-border/60">
          <Skeleton className="h-3.5 w-2/5" />
          <Skeleton className="h-3.5 w-20" />
        </div>
      ))}
    </div>
  )
}

export function OrderTotalsSkeleton({ estimated = false }: { estimated?: boolean }) {
  return (
    <div aria-hidden="true" className="space-y-3">
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn('flex items-center justify-between', i > 0 && estimated ? 'h-9' : 'h-5')}>
            <Skeleton className="h-3.5 w-28" />
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
