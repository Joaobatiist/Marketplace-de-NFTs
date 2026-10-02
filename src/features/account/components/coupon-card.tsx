import { useId } from 'react'
import { Check, TicketPercent } from 'lucide-react'
import type { CouponOffer } from '@/contracts'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { submitButtonClass } from '../form-styles'

interface CouponCardProps {
  coupon: CouponOffer
  /** cupom já aplicado no carrinho atual */
  applied: boolean
  isApplying: boolean
  onApply: () => void
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

export function CouponCard({ coupon, applied, isApplying, onApply }: CouponCardProps) {
  const titleId = useId()
  const { expired } = coupon
  const date = dateFormatter.format(new Date(coupon.expiresAt))

  return (
    <article aria-labelledby={titleId} className={cn('flex h-full flex-col rounded-[3px] border border-border p-5', expired && 'opacity-70')}>
      <div className="flex items-start justify-between gap-3">
        <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <TicketPercent className="size-5" />
        </span>
        <span
          className={cn(
            'rounded-full border px-2.5 py-1 text-xs font-bold',
            expired ? 'border-muted-foreground/50 text-muted-foreground' : 'border-primary text-primary',
          )}
        >
          {expired ? 'Expirado' : 'Ativo'}
        </span>
      </div>
      <h2 id={titleId} className="mt-4 text-xl font-bold tracking-wider">
        {coupon.code}
      </h2>
      <p className="mt-1 text-sm">{coupon.percentOff}% de desconto no subtotal do carrinho</p>
      <p className="mt-1 text-xs text-muted-foreground">{expired ? `Expirou em ${date}` : `Válido até ${date}`}</p>

      <div className="mt-auto pt-5">
        {applied ? (
          <p className="inline-flex h-10 items-center gap-2 text-sm font-bold text-primary">
            <Check aria-hidden="true" className="size-4" />
            Aplicado no carrinho
          </p>
        ) : (
          <button
            type="button"
            onClick={onApply}
            disabled={expired || isApplying}
            aria-describedby={titleId}
            className={cn(submitButtonClass, 'px-5')}
          >
            {isApplying ? 'Aplicando…' : 'Aplicar no carrinho'}
          </button>
        )}
      </div>
    </article>
  )
}

export function CouponCardSkeleton() {
  return <Skeleton className="h-[15.5rem] rounded-[3px]" />
}
