import { CircleCheck, CircleX, Loader2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'

type OrderViewStatus = 'checking' | 'pending' | 'confirmed' | 'declined'

interface OrderStatusViewProps {
  status: OrderViewStatus
  declineReason?: string | null
  onRetry?: () => void
  onBackToCart?: () => void
}

/*
 * Tela inteira de estado do pedido. A região anunciada é UM elemento que persiste entre os
 * status (só o conteúdo e o role mudam): leitores de tela anunciam mudanças em regiões que
 * já existiam, mas nem sempre anunciam uma região que já nasce preenchida.
 * Os botões ficam fora da região para não serem lidos junto com a mensagem.
 */
export function OrderStatusView({ status, declineReason, onRetry, onBackToCart }: OrderStatusViewProps) {
  const declined = status === 'declined'

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-card px-6 py-10 text-center">
        <div role={declined ? 'alert' : 'status'} className="flex flex-col items-center gap-4">
          {status === 'checking' && (
            <>
              <Loader2 aria-hidden="true" className="size-10 animate-spin text-primary motion-reduce:animate-none" />
              <h1 className="text-lg font-bold">Verificando sua última tentativa de compra…</h1>
            </>
          )}

          {status === 'pending' && (
            <>
              <Wallet aria-hidden="true" className="size-10 text-primary" />
              <h1 className="text-lg font-bold">Aguardando confirmação da carteira…</h1>
              <p className="text-sm font-bold text-primary">Não feche esta página.</p>
            </>
          )}

          {status === 'confirmed' && (
            <>
              <CircleCheck aria-hidden="true" className="size-10 text-primary" />
              <h1 className="text-lg font-bold">Pagamento confirmado. Redirecionando…</h1>
            </>
          )}

          {declined && (
            <>
              <CircleX aria-hidden="true" className="size-10 text-destructive" />
              <h1 className="text-xl font-bold">Pagamento recusado</h1>
              <p className="text-sm text-muted-foreground">{declineReason || 'A carteira recusou a transação.'}</p>
              <p className="text-sm">Seus itens continuam no carrinho.</p>
            </>
          )}
        </div>

        {status === 'pending' && (
          // indeterminada: sem aria-valuenow. Com movimento reduzido, a barra fica cheia e parada
          <div role="progressbar" aria-label="Processando pagamento" className="relative h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
            <div className="absolute inset-y-0 left-0 w-1/3 animate-progress rounded-full bg-primary motion-reduce:w-full motion-reduce:animate-none motion-reduce:opacity-60" />
          </div>
        )}

        {declined && (onRetry || onBackToCart) && (
          <div className="mt-2 flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row">
            {onBackToCart && (
              <Button variant="outline" onClick={onBackToCart}>
                Voltar ao carrinho
              </Button>
            )}
            {onRetry && <Button onClick={onRetry}>Tentar novamente</Button>}
          </div>
        )}
      </div>
    </div>
  )
}
