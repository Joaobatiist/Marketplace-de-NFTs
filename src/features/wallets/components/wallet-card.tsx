import { Pencil } from 'lucide-react'
import type { Wallet } from '@/contracts'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NETWORK_LABELS, shortenHex, WALLET_ROLE_LABELS } from '@/features/checkout/format'

interface WalletCardProps {
  wallet: Wallet
  onEdit: (trigger: HTMLButtonElement) => void
}

export function WalletCard({ wallet, onEdit }: WalletCardProps) {
  return (
    <article aria-labelledby={`wallet-${wallet.id}`} className="flex flex-wrap items-start justify-between gap-4 rounded-xl bg-card p-5">
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 id={`wallet-${wallet.id}`} className="font-bold">
            {wallet.label}
          </h3>
          <span className="rounded-full border border-primary/50 px-2 py-0.5 text-[0.6875rem] leading-none text-primary">
            {WALLET_ROLE_LABELS[wallet.role]}
          </span>
        </div>
        <p className="font-mono text-sm text-muted-foreground" title={wallet.address}>
          <span className="sr-only">Endereço </span>
          {shortenHex(wallet.address)}
        </p>
        <p className="text-xs text-muted-foreground">Redes: {wallet.networks.map((n) => NETWORK_LABELS[n]).join(', ')}</p>
      </div>
      <Button variant="outline" size="sm" onClick={(e) => onEdit(e.currentTarget)} aria-label={`Editar ${wallet.label}`}>
        <Pencil aria-hidden="true" className="size-4" />
        Editar
      </Button>
    </article>
  )
}

export function WalletCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex items-start justify-between gap-4 rounded-xl bg-card p-5">
      <div className="flex-1 space-y-1.5">
        <div className="flex h-6 items-center"><Skeleton className="h-4 w-40" /></div>
        <div className="flex h-5 items-center"><Skeleton className="h-3.5 w-28" /></div>
        <div className="flex h-4 items-center"><Skeleton className="h-3 w-36" /></div>
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  )
}
