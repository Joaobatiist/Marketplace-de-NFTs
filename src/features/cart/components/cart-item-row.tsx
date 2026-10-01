import { TrendingUp, Trash2 } from 'lucide-react'
import type { CartItem } from '@/contracts'
import { formatEth, toDecimal } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { NftImage } from '@/features/catalog/components/nft-image'
import { QuantityInput } from '@/features/nft/components/purchase-panel'

interface CartItemRowProps {
  item: CartItem
  onQuantityChange: (q: number) => void
  onRemove: () => void
}

/*
 * Linha do carrinho (Figma): imagem, nome + edição, preço unitário, quantidade, total e lixeira.
 * Mobile: card empilhado; a partir de md, as colunas do print.
 */
export function CartItemRow({ item, onQuantityChange, onRemove }: CartItemRowProps) {
  const max = Math.min(item.available, item.maxPerOrder)
  const soldOut = item.available === 0
  const priceChanged = !toDecimal(item.unitPrice).eq(item.priceSeen)
  const lineTotal = toDecimal(item.unitPrice).times(item.quantity).toString()

  return (
    <article
      aria-label={`${item.name}, edição ${item.editionName}`}
      className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3 rounded-xl bg-card p-3 md:grid-cols-[4.5rem_minmax(0,1fr)_auto_7rem_auto] md:items-center"
    >
      <div className={cn('size-18 overflow-hidden rounded-lg', soldOut && 'opacity-50 grayscale')}>
        <NftImage src={item.image} alt="" />
      </div>

      <div className="min-w-0 space-y-1">
        <h2 className="truncate font-bold">{item.name}</h2>
        <p className="text-xs text-muted-foreground">Edição: {item.editionName}</p>
        <p className="text-sm">
          <span className="sr-only">Preço unitário: </span>
          <span className="font-bold text-primary">{formatEth(item.unitPrice)}</span>
        </p>
        {soldOut && <p className="text-xs font-bold text-destructive">Esgotado</p>}
        {priceChanged && (
          // ícone + texto: a mudança não é indicada só pela cor
          <p className="flex items-center gap-1 text-xs text-primary">
            <TrendingUp aria-hidden="true" className="size-3.5 shrink-0" />
            Preço alterado: de {formatEth(item.priceSeen)} para {formatEth(item.unitPrice)}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover ${item.name}`}
        className="inline-flex size-10 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:order-last"
      >
        <Trash2 aria-hidden="true" className="size-5" />
      </button>

      <div className="col-span-2 md:col-span-1">
        <QuantityInput value={item.quantity} max={max} onChange={onQuantityChange} itemName={item.name} />
      </div>

      <p className="text-right text-sm">
        <span className="block text-xs text-muted-foreground md:sr-only">Total</span>
        <span className="font-bold text-primary">{formatEth(lineTotal)}</span>
      </p>
    </article>
  )
}

export function CartItemRowSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3 rounded-xl bg-card p-3 md:grid-cols-[4.5rem_minmax(0,1fr)_auto_7rem_auto] md:items-center"
    >
      <Skeleton className="size-18 rounded-lg" />
      <div className="space-y-1">
        <div className="flex h-6 items-center"><Skeleton className="h-4 w-2/3" /></div>
        <div className="flex h-4 items-center"><Skeleton className="h-3 w-1/3" /></div>
        <div className="flex h-5 items-center"><Skeleton className="h-3.5 w-20" /></div>
      </div>
      <Skeleton className="size-10 md:order-last" />
      <div className="col-span-2 space-y-1.5 md:col-span-1">
        <div className="flex items-center gap-3">
          <Skeleton className="h-3.5 w-8" />
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="h-10 w-14" />
          <Skeleton className="size-10 rounded-full" />
        </div>
        <div className="h-4" />
      </div>
      <div className="flex h-9 items-end justify-end md:h-5 md:items-center"><Skeleton className="h-3.5 w-20" /></div>
    </div>
  )
}
