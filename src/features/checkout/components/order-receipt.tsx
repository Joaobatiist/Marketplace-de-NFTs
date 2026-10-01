import { useEffect, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Check, CircleCheck, Copy, ExternalLink, MailCheck } from 'lucide-react'
import type { Order } from '@/contracts'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, NETWORK_LABELS, shortenHex } from '../format'
import { OrderLines, OrderLinesSkeleton, OrderTotals, OrderTotalsSkeleton } from './order-summary'

interface OrderReceiptProps {
  order: Order
}

const actionClass = cn(
  'inline-flex h-11 items-center justify-center gap-2 rounded-md px-6 text-sm font-bold transition-colors',
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none',
)

/** recibo do pedido confirmado (print "Order Confirmation"), como página */
export function OrderReceipt({ order }: OrderReceiptProps) {
  const network = NETWORK_LABELS[order.network]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <article aria-labelledby="receipt-title" className="overflow-hidden rounded-2xl bg-card">
        <header className="flex flex-col items-center gap-3 px-6 pt-8 pb-6 text-center">
          <MailCheck aria-hidden="true" className="size-14 text-primary" strokeWidth={1.25} />
          {/* resultado: ícone + texto (não só cor) */}
          <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 px-3 py-1 text-xs font-bold text-primary">
            <CircleCheck aria-hidden="true" className="size-3.5" />
            Pagamento confirmado
          </p>
          <h1 id="receipt-title" className="text-lg font-bold text-primary md:text-xl">
            Seus NFTs agora estão na sua carteira
          </h1>
          <p className="text-sm text-muted-foreground">
            Pedido <span className="font-mono text-foreground">#{order.id}</span>
          </p>
        </header>

        {/* faixa do Figma: hash | data | total | rede */}
        <dl className="grid grid-cols-2 border-y border-primary/60 md:grid-cols-4">
          <InfoCell label="Hash da transação">
            {order.txHash ? <CopyHash hash={order.txHash} /> : <span className="text-muted-foreground">—</span>}
          </InfoCell>
          <InfoCell label="Data">
            {/* formato curto: a faixa tem colunas estreitas (2 no mobile, 4 no desktop) e o longo seria cortado */}
            <time dateTime={order.createdAt} title={formatDateTime(order.createdAt)} className="truncate">
              {formatDateTime(order.createdAt, 'short')}
            </time>
          </InfoCell>
          <InfoCell label="Total"><span className="truncate">{formatEth(order.total)}</span></InfoCell>
          <InfoCell label="Rede"><span className="truncate">{network}</span></InfoCell>
        </dl>

        <div className="space-y-6 px-6 py-6">
          <section aria-labelledby="receipt-items" className="space-y-4">
            <h2 id="receipt-items" className="font-bold">
              Detalhes da transação
            </h2>
            <OrderLines lines={order.lines} caption="NFTs comprados" />
            <OrderTotals subtotal={order.subtotal} discount={order.discount} networkFee={order.networkFee} total={order.total} />
          </section>

          <section aria-labelledby="receipt-buyer" className="rounded-xl bg-background/60 p-4 text-sm">
            <h2 id="receipt-buyer" className="mb-2 font-bold">
              Colecionador
            </h2>
            <p>{order.buyer.name}</p>
            <p className="break-all text-muted-foreground">{order.buyer.email}</p>
          </section>

          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            Transação confirmada na {network}. A propriedade foi transferida para sua carteira conectada e registrada na rede.
          </p>

          <div className="flex flex-col-reverse items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link to="/" className={cn(actionClass, 'border border-input hover:bg-accent')}>
              Continuar explorando
            </Link>
            {order.explorerUrl && (
              <a href={order.explorerUrl} target="_blank" rel="noopener noreferrer" className={cn(actionClass, 'bg-primary text-primary-foreground hover:bg-primary/90')}>
                Ver no explorador (simulado)
                <ExternalLink aria-hidden="true" className="size-4" />
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}

// mesma classe no skeleton: bordas e alturas idênticas
const infoCellClass = 'min-w-0 border-primary/40 px-4 py-3 odd:border-r max-md:[&:nth-child(-n+2)]:border-b md:border-r md:last:border-r-0'

function InfoCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={infoCellClass}>
      <dt className="text-xs font-bold text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 flex h-7 min-w-0 items-center text-sm">{children}</dd>
    </div>
  )
}

/** hash abreviado + copiar; o resultado é anunciado ("Copiado") e o ícone vira check por 2s */
function CopyHash({ hash }: { hash: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const timer = setTimeout(() => setState('idle'), 2000)
    return () => clearTimeout(timer)
  }, [state])

  async function copy() {
    try {
      await navigator.clipboard.writeText(hash)
      setState('copied')
    } catch {
      setState('failed')
    }
  }

  return (
    <span className="flex items-center gap-1.5">
      <span className="truncate font-mono" title={hash}>
        {shortenHex(hash)}
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label="Copiar hash da transação"
        className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-primary hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {state === 'copied' ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
      </button>
      <span aria-live="polite" className="sr-only">
        {state === 'copied' ? 'Copiado' : state === 'failed' ? 'Não foi possível copiar' : ''}
      </span>
    </span>
  )
}

export function OrderReceiptSkeleton() {
  return (
    <div role="status" className="mx-auto max-w-3xl px-4 py-8">
      <span className="sr-only">Carregando pedido…</span>
      <div aria-hidden="true" className="overflow-hidden rounded-2xl bg-card">
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6">
          <Skeleton className="size-14 rounded-full" />
          <Skeleton className="h-[1.625rem] w-44 rounded-full" />
          <div className="flex h-7 w-full items-center justify-center max-[31rem]:h-14">
            <Skeleton className="h-5 w-72 max-w-full" />
          </div>
          <div className="flex h-5 items-center">
            <Skeleton className="h-3.5 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-2 border-y border-primary/60 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={infoCellClass}>
              <div className="flex h-4 items-center"><Skeleton className="h-3 w-20" /></div>
              <div className="mt-0.5 flex h-7 items-center"><Skeleton className="h-3.5 w-24" /></div>
            </div>
          ))}
        </div>
        <div className="space-y-6 px-6 py-6">
          <div className="space-y-4">
            <div className="flex h-6 items-center">
              <Skeleton className="h-4 w-44" />
            </div>
            <OrderLinesSkeleton />
            <OrderTotalsSkeleton />
          </div>
          <Skeleton className="h-[6.25rem] rounded-xl" />
        </div>
      </div>
    </div>
  )
}
