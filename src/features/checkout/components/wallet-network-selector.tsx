import { useId, type ReactNode } from 'react'
import { NETWORKS, type Network, type Wallet } from '@/contracts'
import { cn } from '@/lib/utils'
import { NETWORK_LABELS, shortenHex, WALLET_ROLE_LABELS } from '../format'

interface WalletNetworkSelectorProps {
  wallets: Wallet[]
  walletId: string
  network: Network | undefined
  onWalletChange: (id: string) => void
  onNetworkChange: (n: Network) => void
  walletError?: string
  networkError?: string
}

export function WalletNetworkSelector({
  wallets,
  walletId,
  network,
  onWalletChange,
  onNetworkChange,
  walletError,
  networkError,
}: WalletNetworkSelectorProps) {
  const id = useId()
  const wallet = wallets.find((w) => w.id === walletId)
  // sem carteira: mostra todas as redes desabilitadas (o layout não pula quando a carteira é escolhida)
  const networks = wallet ? wallet.networks : NETWORKS

  return (
    <div className="space-y-8">
      <fieldset aria-describedby={walletError ? `${id}-wallet-error` : undefined}>
        <legend className="mb-3 text-lg font-semibold">Carteira</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {wallets.map((w) => (
            <ChoiceCard
              key={w.id}
              name={`${id}-wallet`}
              value={w.id}
              checked={w.id === walletId}
              onChange={() => onWalletChange(w.id)}
              invalid={!!walletError}
              label={
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{w.label}</span>
                  <span className="rounded-full border border-primary/50 px-2 py-0.5 text-[0.6875rem] leading-none text-primary">
                    {WALLET_ROLE_LABELS[w.role]}
                  </span>
                </span>
              }
              description={
                <>
                  <span className="block font-mono text-xs text-muted-foreground" title={w.address}>
                    <span className="sr-only">Endereço </span>
                    {shortenHex(w.address)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {w.networks.length > 0 ? `Redes: ${w.networks.map((n) => NETWORK_LABELS[n]).join(', ')}` : 'Nenhuma rede habilitada'}
                  </span>
                </>
              }
            />
          ))}
        </div>
        {walletError && (
          <p id={`${id}-wallet-error`} className="mt-2 text-sm text-destructive">
            {walletError}
          </p>
        )}
      </fieldset>

      <fieldset
        disabled={!wallet}
        aria-describedby={[!wallet && `${id}-network-hint`, networkError && `${id}-network-error`].filter(Boolean).join(' ') || undefined}
      >
        <legend className="mb-3 text-lg font-semibold">Rede</legend>
        {!wallet && (
          <p id={`${id}-network-hint`} className="mb-3 text-sm text-muted-foreground">
            Escolha uma carteira primeiro.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          {networks.map((n) => (
            <ChoiceCard
              key={n}
              name={`${id}-network`}
              value={n}
              checked={n === network}
              onChange={() => onNetworkChange(n)}
              invalid={!!networkError}
              icon={
                <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-background text-sm font-bold text-primary">
                  {NETWORK_LABELS[n][0]}
                </span>
              }
              label={<span className="font-medium">{NETWORK_LABELS[n]}</span>}
            />
          ))}
        </div>
        {networkError && (
          <p id={`${id}-network-error`} className="mt-2 text-sm text-destructive">
            {networkError}
          </p>
        )}
      </fieldset>
    </div>
  )
}

interface ChoiceCardProps {
  name: string
  value: string
  checked: boolean
  onChange: () => void
  invalid?: boolean
  icon?: ReactNode
  /** nome acessível do radio (só o rótulo: "Ethereum", "Carteira principal Principal") */
  label: ReactNode
  /** detalhes lidos como descrição (aria-describedby), fora do nome */
  description?: ReactNode
}

/** card do Figma com radio nativo (setas do teclado funcionam); o círculo desenhado é só visual */
function ChoiceCard({ name, value, checked, onChange, invalid, icon, label, description }: ChoiceCardProps) {
  const labelId = useId()
  const descriptionId = useId()
  return (
    <label
      className={cn(
        'relative flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-card p-4 text-sm transition-colors',
        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background',
        'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
        checked ? 'border-primary' : invalid ? 'border-destructive/60' : 'border-transparent hover:border-primary/40',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        // cobre o card inteiro, transparente: o radio nativo é o alvo do clique e do teclado
        className="absolute inset-0 z-10 m-0 cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
      />
      {icon}
      <span className="min-w-0 flex-1 space-y-1">
        <span id={labelId} className="block">{label}</span>
        {description && (
          <span id={descriptionId} className="block space-y-1">
            {description}
          </span>
        )}
      </span>
      {/* selecionado: anel + ponto preenchido (forma, não só cor) */}
      <span
        aria-hidden="true"
        className={cn('flex size-5 shrink-0 items-center justify-center rounded-full border-2', checked ? 'border-primary' : 'border-muted-foreground/60')}
      >
        {checked && <span className="size-2.5 rounded-full bg-primary" />}
      </span>
    </label>
  )
}
