import { WifiOff } from 'lucide-react'

interface RealtimeStatusBannerProps {
  status: 'connecting' | 'connected' | 'reconnecting'
}

/*
 * Faixa discreta presa ao topo da tela (position: fixed): aparece sobre o conteúdo, sem
 * empurrar nada, então não causa layout shift. A região role="status" fica sempre no DOM,
 * para o leitor de tela anunciar quando a mensagem aparece.
 */
export function RealtimeStatusBanner({ status }: RealtimeStatusBannerProps) {
  const reconnecting = status === 'reconnecting'

  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-2">
      {reconnecting && (
        <p className="flex items-center gap-2 rounded-full border border-primary/60 bg-card/95 px-4 py-1.5 text-xs shadow-lg backdrop-blur">
          <WifiOff aria-hidden="true" className="size-3.5 text-primary" />
          Conexão em tempo real perdida. Reconectando…
        </p>
      )}
    </div>
  )
}
