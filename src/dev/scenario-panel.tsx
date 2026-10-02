import { useId, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import type { Cart } from '@/contracts'
import { cartKeys, useCartOwner } from '@/features/cart/queries'
import { sessionQueryOptions } from '@/features/auth/queries'
import { toDecimal } from '@/lib/eth'
import { DEFAULT_SCENARIO, PRESETS, type PresetName, type ScenarioConfig } from '@/mocks/scenarios'
import type { resetAll } from '@/mocks/reset'
import type { updateEdition } from '@/mocks/db'
import type { dropAllConnections } from '@/mocks/realtime'
import type { scenario } from '@/mocks/scenarios'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

/** helper de testes exposto pelo mocks/browser.ts */
interface MockApi {
  scenario: typeof scenario
  resetAll: typeof resetAll
  updateEdition: typeof updateEdition
  dropAllConnections: typeof dropAllConnections
}
const mock = () => (window as unknown as { __mock: MockApi }).__mock

const PRESET_LABELS: Record<PresetName, string> = {
  default: 'Padrão',
  fast: 'Rápido',
  slow: 'Lento',
  jitter: 'Respostas fora de ordem',
  offline: 'Sem conexão',
  'server-error': 'Erro no servidor',
  'favorites-fail': 'Falha nos favoritos',
  'order-timeout': 'Timeout no pedido',
  'payment-declined': 'Pagamento recusado',
  'wallet-rejected': 'Carteira recusa conexão',
}
const PRESET_NAMES = Object.keys(PRESETS) as PresetName[]

/** qual preset corresponde à configuração atual (ou null se foi alterada à mão) */
function activePreset(config: ScenarioConfig): PresetName | null {
  const same = (a: ScenarioConfig, b: ScenarioConfig) =>
    (Object.keys(a) as (keyof ScenarioConfig)[]).every((k) => a[k] === b[k])
  return PRESET_NAMES.find((name) => same(config, { ...DEFAULT_SCENARIO, ...PRESETS[name] })) ?? null
}

/*
 * Painel de demonstração dos cenários do MSW (só existe com VITE_ENABLE_MOCKS=true).
 * Renderizado depois do rodapé: não entra no fluxo de Tab antes do conteúdo principal.
 * As ações agem no "servidor" simulado (window.__mock); nada é injetado direto na UI.
 */
export function ScenarioPanel() {
  const queryClient = useQueryClient()
  const owner = useCartOwner()
  const selectLabelId = useId()
  const current = activePreset(mock().scenario.get())
  const [selected, setSelected] = useState<PresetName>(current ?? 'default')
  const [open, setOpen] = useState(false)
  const currentLabel = current ? PRESET_LABELS[current] : 'Personalizado'

  const firstCartItem = () => queryClient.getQueryData<Cart>(cartKeys.cart(owner ?? 'guest'))?.items[0]

  const actions: { label: string; run: () => void | Promise<void> }[] = [
    {
      label: 'Expirar sessão',
      run: async () => {
        await fetch('/api/__dev/expire-sessions', { method: 'POST' })
        // a próxima leitura da sessão recebe 401 SESSION_EXPIRED e o app trata a expiração
        await queryClient.invalidateQueries({ queryKey: sessionQueryOptions.queryKey })
        toast.info('Sessões expiradas no servidor simulado.')
      },
    },
    {
      label: 'Derrubar tempo real',
      run: () => {
        mock().dropAllConnections()
        toast.info('Conexões de tempo real derrubadas. O cliente vai reconectar.')
      },
    },
    {
      label: 'Alterar preço do 1º item do carrinho',
      run: () => {
        const item = firstCartItem()
        if (!item) return void toast.error('O carrinho está vazio.')
        const price = toDecimal(item.unitPrice).times(1.5).toDecimalPlaces(6).toString()
        mock().updateEdition(item.nftId, item.editionId, { price })
        toast.info(`Preço de ${item.name} alterado no servidor.`)
      },
    },
    {
      label: 'Esgotar 1º item do carrinho',
      run: () => {
        const item = firstCartItem()
        if (!item) return void toast.error('O carrinho está vazio.')
        mock().updateEdition(item.nftId, item.editionId, { available: 0 })
        toast.info(`${item.name} esgotado no servidor.`)
      },
    },
    {
      label: 'Resetar dados',
      run: () => {
        mock().resetAll()
        toast.info('Dados resetados.')
        location.assign('/')
      },
    },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-20 left-4 z-30 bg-card/95 shadow-lg backdrop-blur lg:bottom-6 lg:left-6"
        >
          <FlaskConical aria-hidden="true" className="size-4" />
          Cenários: {currentLabel}
        </Button>
      </SheetTrigger>

      {/* o Radix prende o foco no Sheet e devolve ao botão ao fechar */}
      <SheetContent side="right" className="w-[90vw] max-w-sm gap-0 overflow-y-auto bg-card">
        <SheetHeader className="pr-12">
          <SheetTitle>Cenários de teste</SheetTitle>
          <SheetDescription>
            Simulação de rede e falhas do servidor mockado. Ativo agora: <strong>{currentLabel}</strong>.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          <section className="space-y-2">
            <h3 id={selectLabelId} className="text-sm font-bold">
              Cenário
            </h3>
            <Select value={selected} onValueChange={(v) => setSelected(v as PresetName)}>
              <SelectTrigger aria-labelledby={selectLabelId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESET_NAMES.map((name) => (
                  <SelectItem key={name} value={name}>
                    {PRESET_LABELS[name]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              onClick={() => {
                mock().scenario.applyPreset(selected)
                toast.info(`Cenário "${PRESET_LABELS[selected]}" aplicado. Recarregando…`)
                // sem ?scenario/?reset na URL: senão o main.tsx reaplicaria o cenário antigo no reload
                const url = new URL(location.href)
                url.searchParams.delete('scenario')
                url.searchParams.delete('reset')
                location.replace(url)
              }}
            >
              Aplicar e recarregar
            </Button>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold">Ações no servidor simulado</h3>
            <ul className="space-y-2">
              {actions.map((action) => (
                <li key={action.label}>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      // fecha antes: o Sheet é modal e deixaria a página (ex.: o login após expirar a sessão) inerte
                      setOpen(false)
                      void action.run()
                    }}
                  >
                    {action.label}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
