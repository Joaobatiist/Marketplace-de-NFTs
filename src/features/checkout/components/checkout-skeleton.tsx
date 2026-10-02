import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckoutSteps } from './checkout-steps'

/*
 * Mesmo layout da página de pagamento no estado inicial (sem carteira escolhida).
 * Título e etapas são estáticos, então são os componentes reais; o resto repete os mesmos
 * wrappers e alturas de linha do formulário, do WalletNetworkSelector e do WalletConnectionStatus.
 */
export function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-bold">Pagamento</h1>
      <CheckoutSteps current="details" />

      <div role="status" className="space-y-8">
        <span className="sr-only">Carregando pagamento…</span>

        <div aria-hidden="true" className="space-y-8">
          {/* Dados do colecionador */}
          <div className="space-y-4">
            <Line className="mb-2 h-7 w-56" bar="h-4" />
            {[0, 1].map((i) => (
              <div key={i} className="space-y-2">
                <Line className="h-3.5 w-16" bar="h-3" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>

          {/* WalletNetworkSelector */}
          <div className="space-y-8">
            <div>
              <Line className="mb-3 h-7 w-24" bar="h-4" />
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1].map((i) => (
                  <CardShell key={i}>
                    <span className="min-w-0 flex-1 space-y-1">
                      <Line className="h-5 w-2/3" bar="h-3.5" />
                      <Line className="h-4 w-1/2" bar="h-3" />
                      <Line className="h-4 w-3/4" bar="h-3" />
                    </span>
                  </CardShell>
                ))}
              </div>
            </div>
            <div>
              <Line className="mb-3 h-7 w-16" bar="h-4" />
              <Line className="mb-3 h-5 w-60 max-w-full" bar="h-3.5" />
              <div className="grid gap-3 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <CardShell key={i}>
                    <Skeleton className="size-9 shrink-0 rounded-full" />
                    <span className="min-w-0 flex-1">
                      <Line className="h-5 w-20" bar="h-3.5" />
                    </span>
                  </CardShell>
                ))}
              </div>
            </div>
          </div>

          {/* WalletConnectionStatus (desconectada, sem carteira/rede) */}
          <div className="space-y-3 rounded-xl bg-card p-5">
            <Line className="h-6 w-44" bar="h-4" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Line className="h-5 w-52" bar="h-3.5" />
              <Skeleton className="h-10 w-full sm:w-40" />
            </div>
            <Line className="h-5 w-52 max-w-full" bar="h-3.5" />
          </div>

          <Skeleton className="h-10 w-full sm:w-36" />
        </div>
      </div>
    </div>
  )
}

/** caixa com a altura de uma linha de texto real e a barra de shimmer dentro */
function Line({ className, bar }: { className: string; bar: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <Skeleton className={`w-full ${bar}`} />
    </div>
  )
}

/** mesmo contorno do ChoiceCard (borda de 2px transparente, p-4, radio de 20px) */
function CardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border-2 border-transparent bg-card p-4">
      {children}
      <Skeleton className="size-5 shrink-0 rounded-full" />
    </div>
  )
}
