import { useId } from 'react'
import { TriangleAlert } from 'lucide-react'
import type { CartItem, QuoteIssue } from '@/contracts'
import { formatEth } from '@/lib/eth'
import { Button } from '@/components/ui/button'

interface PriceChangeAlertProps {
  issues: QuoteIssue[]
  items: CartItem[]
  onAcknowledge: () => void
  isPending: boolean
}

function describe(issue: QuoteIssue, name: string) {
  switch (issue.type) {
    case 'PRICE_CHANGED':
      return `${name}: preço mudou de ${formatEth(issue.oldPrice)} para ${formatEth(issue.newPrice)}`
    case 'OUT_OF_STOCK':
      return `${name}: esgotado, será removido`
    case 'QUANTITY_REDUCED':
      return `${name}: só ${issue.available} ${issue.available === 1 ? 'disponível' : 'disponíveis'}`
  }
}

/** a cotação diverge do carrinho: lista as mudanças; o pagamento só libera depois de aceitar */
export function PriceChangeAlert({ issues, items, onAcknowledge, isPending }: PriceChangeAlertProps) {
  const titleId = useId()
  const nameOf = (issue: QuoteIssue) =>
    items.find((i) => i.nftId === issue.nftId && i.editionId === issue.editionId)?.name ?? 'Item'

  return (
    <div role="alert" aria-labelledby={titleId} className="space-y-4 rounded-xl border border-primary/60 bg-card p-5">
      <div className="flex items-start gap-3">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="space-y-2">
          <h2 id={titleId} className="font-bold">
            Seu carrinho mudou
          </h2>
          <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
            {issues.map((issue) => (
              <li key={`${issue.type}-${issue.nftId}-${issue.editionId}`}>{describe(issue, nameOf(issue))}</li>
            ))}
          </ul>
        </div>
      </div>
      <Button onClick={onAcknowledge} disabled={isPending} aria-busy={isPending || undefined}>
        {isPending ? 'Atualizando…' : 'Atualizar carrinho'}
      </Button>
    </div>
  )
}
