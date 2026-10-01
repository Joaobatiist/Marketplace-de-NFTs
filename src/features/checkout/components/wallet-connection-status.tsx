import { useId } from 'react'
import { CircleCheck, Loader2, TriangleAlert, Unplug } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface WalletConnectionStatusProps {
  status: ConnectionStatus
  walletLabel?: string
  error?: string
  canConnect: boolean
  onConnect: () => void
  onDisconnect: () => void
}

export function WalletConnectionStatus({ status, walletLabel, error, canConnect, onConnect, onDisconnect }: WalletConnectionStatusProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const label = walletLabel ?? 'carteira'

  // texto anunciado a cada troca de status; o erro já tem role="alert" próprio, então fica de fora
  const announcement = {
    disconnected: 'Carteira desconectada.',
    connecting: 'Conectando carteira…',
    connected: `Carteira conectada: ${label}.`,
    error: '',
  }[status]

  const hint = !canConnect && (
    <p id={hintId} className="text-sm text-muted-foreground">
      Selecione carteira e rede.
    </p>
  )

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-3 rounded-xl bg-card p-5">
      <h2 id={`${id}-title`} className="font-semibold">
        Conexão da carteira
      </h2>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {status === 'disconnected' && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Unplug aria-hidden="true" className="size-4" />
            Nenhuma carteira conectada
          </p>
          <Button onClick={onConnect} disabled={!canConnect} aria-describedby={!canConnect ? hintId : undefined}>
            Conectar carteira
          </Button>
        </div>
      )}

      {status === 'connecting' && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Confirme a conexão na sua carteira.</p>
          <Button disabled aria-busy="true">
            <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
            Conectando…
          </Button>
        </div>
      )}

      {status === 'connected' && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm font-bold text-primary">
            <CircleCheck aria-hidden="true" className="size-5" />
            Conectada: {label}
          </p>
          <Button variant="outline" onClick={onDisconnect}>
            Desconectar
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {error ?? 'Não foi possível conectar a carteira.'}
          </p>
          <Button variant="outline" onClick={onConnect} disabled={!canConnect} aria-describedby={!canConnect ? hintId : undefined}>
            Tentar novamente
          </Button>
        </div>
      )}

      {(status === 'disconnected' || status === 'error') && hint}
    </section>
  )
}
