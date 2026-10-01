import { useId, useState } from 'react'
import { Check, Minus, Plus, ShoppingCart } from 'lucide-react'
import type { NftEdition } from '@/contracts'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface PurchasePanelProps {
  editions: NftEdition[]
  selectedEditionId: string
  onEditionChange: (id: string) => void
  quantity: number
  maxQuantity: number
  onQuantityChange: (q: number) => void
  onAddToCart?: () => void
  isAdding?: boolean
}

export function PurchasePanel({
  editions,
  selectedEditionId,
  onEditionChange,
  quantity,
  maxQuantity,
  onQuantityChange,
  onAddToCart,
  isAdding = false,
}: PurchasePanelProps) {
  const titleId = useId()
  const selected = editions.find((e) => e.id === selectedEditionId) ?? editions[0]
  const soldOut = maxQuantity === 0

  return (
    <section aria-labelledby={titleId} className="space-y-6 border-t pt-6">
      <h2 id={titleId} className="sr-only">
        Comprar
      </h2>

      {/* preço e estoque mudam com a edição: anunciados para quem usa leitor de tela */}
      <div aria-live="polite" className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-3xl font-bold text-primary">
          <span className="sr-only">Preço: </span>
          {selected ? formatEth(selected.price) : '—'}
        </p>
        <p className={cn('text-sm', selected?.available ? 'text-muted-foreground' : 'font-bold text-destructive')}>
          {selected?.available ? `${selected.available} ${selected.available === 1 ? 'disponível' : 'disponíveis'}` : 'Esgotada'}
        </p>
      </div>

      <EditionPicker editions={editions} value={selected?.id} onChange={onEditionChange} />

      <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
        <QuantityInput value={quantity} max={maxQuantity} onChange={onQuantityChange} />

        {onAddToCart && (
          <Button
            size="lg"
            onClick={onAddToCart}
            disabled={soldOut || isAdding}
            aria-busy={isAdding || undefined}
            className="min-w-52 flex-1 font-bold uppercase sm:flex-none"
          >
            <ShoppingCart aria-hidden="true" className="size-4" />
            {soldOut ? 'Indisponível' : isAdding ? 'Adicionando…' : 'Adicionar ao carrinho'}
          </Button>
        )}
      </div>
    </section>
  )
}

interface EditionPickerProps {
  editions: NftEdition[]
  value: string | undefined
  onChange: (id: string) => void
}

/*
 * radiogroup com <input type="radio"> nativo: setas trocam a opção, edições esgotadas ficam
 * desabilitadas (o navegador pula) e mostram "Esgotada" por escrito, não só esmaecidas.
 */
function EditionPicker({ editions, value, onChange }: EditionPickerProps) {
  const name = useId()

  return (
    <fieldset>
      <legend className="mb-3 text-sm font-bold">Edição:</legend>
      <div className="flex flex-wrap gap-2">
        {editions.map((edition) => {
          const checked = edition.id === value
          const soldOut = edition.available === 0
          return (
            <label
              key={edition.id}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background',
                soldOut
                  ? 'cursor-not-allowed border-border text-muted-foreground/60'
                  : 'cursor-pointer border-input hover:border-primary/60',
                // selecionada: borda e texto laranja + negrito + ícone de check
                checked && 'border-primary font-bold text-primary',
              )}
            >
              <input
                type="radio"
                name={name}
                value={edition.id}
                checked={checked}
                disabled={soldOut}
                onChange={() => onChange(edition.id)}
                className="sr-only"
              />
              {checked && <Check aria-hidden="true" className="size-3.5" />}
              <span className={cn(soldOut && 'line-through')}>{edition.name}</span>
              <span className="text-xs text-muted-foreground">1/{edition.supply}</span>
              {soldOut && <span className="text-xs">· Esgotada</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

interface QuantityInputProps {
  value: number
  max: number
  onChange: (q: number) => void
  /** em listas (carrinho), completa os rótulos acessíveis: "Qtd. de {itemName}" */
  itemName?: string
}

/** − / campo / +, sempre entre 1 e max; avisa por escrito quando chega ao limite */
export function QuantityInput({ value, max, onChange, itemName }: QuantityInputProps) {
  const of = itemName ? ` de ${itemName}` : ''
  const id = useId()
  const [draft, setDraft] = useState(String(value))
  const [prevValue, setPrevValue] = useState(value)
  const disabled = max < 1
  const atLimit = !disabled && value >= max

  // valor mudou por fora (troca de edição, estoque): alinha o campo
  if (value !== prevValue) {
    setPrevValue(value)
    setDraft(String(value))
  }

  const clamp = (n: number) => Math.min(Math.max(n, 1), Math.max(max, 1))

  function change(next: number) {
    const clamped = clamp(next)
    setDraft(String(clamped))
    if (clamped !== value) onChange(clamped)
  }

  function handleType(raw: string) {
    // deixa o campo vazio enquanto a pessoa digita; acima do limite já corta no máximo
    setDraft(raw)
    const n = Number.parseInt(raw, 10)
    if (Number.isNaN(n) || n < 1) return
    change(n)
  }

  const stepClass = cn(
    'inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity',
    'hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
    'disabled:cursor-not-allowed disabled:opacity-40',
  )

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <label htmlFor={id} className="text-sm text-muted-foreground">
          Qtd.
          {itemName && <span className="sr-only">{of}</span>}
        </label>
        <button
          type="button"
          onClick={() => change(value - 1)}
          disabled={disabled || value <= 1}
          aria-label={`Diminuir quantidade${of}`}
          aria-controls={id}
          className={stepClass}
        >
          <Minus aria-hidden="true" className="size-4" />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          max={Math.max(max, 1)}
          step={1}
          value={draft}
          disabled={disabled}
          onChange={(e) => handleType(e.target.value)}
          onBlur={() => change(Number.parseInt(draft, 10) || value)}
          aria-describedby={`${id}-limit`}
          className={cn(
            'h-10 w-14 rounded-md border border-input bg-background text-center text-base font-bold',
            '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        />
        <button
          type="button"
          onClick={() => change(value + 1)}
          disabled={disabled || value >= max}
          aria-label={`Aumentar quantidade${of}`}
          aria-controls={id}
          className={stepClass}
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>
      {/* sempre no DOM (com altura fixa): o aviso é anunciado ao aparecer e não empurra o layout */}
      <p id={`${id}-limit`} aria-live="polite" className="h-4 text-xs text-muted-foreground">
        {atLimit ? `Máximo de ${max} por pedido` : ''}
      </p>
    </div>
  )
}
