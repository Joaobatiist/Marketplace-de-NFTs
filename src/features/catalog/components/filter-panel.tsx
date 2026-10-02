import { useId, useState, type FormEvent } from 'react'
import { Check, SlidersHorizontal } from 'lucide-react'
import { NFT_CATEGORIES, type NftCategory } from '@/contracts'
import type { CatalogFilters } from '@/features/catalog/search'
import { toDecimal } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/use-media-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'

const CATEGORY_LABELS: Record<NftCategory, string> = {
  digital_art: 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  art_3d: 'Arte 3D',
  collectibles: 'Colecionáveis',
  generative: 'Generativa',
  gaming: 'Jogos',
  memberships: 'Assinaturas',
  utility: 'Utilidade',
}

const DECIMAL = /^\d+(\.\d+)?$/

interface FilterPanelProps {
  value: CatalogFilters
  onChange: (patch: Partial<CatalogFilters>) => void
  onClear: () => void
}

function countActive({ category, minPrice, maxPrice, onlyAvailable }: CatalogFilters) {
  return [category, minPrice || maxPrice, onlyAvailable].filter(Boolean).length
}

export function FilterPanel(props: FilterPanelProps) {
  // renderiza só uma versão: evita ids duplicados e campos escondidos no DOM.
  // lg (1024px) = mesmo breakpoint em que a rota mostra a <aside> lateral
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const titleId = useId()
  const activeCount = countActive(props.value)

  if (isDesktop) {
    // pilha vertical, como a barra lateral do Figma
    return (
      <section aria-labelledby={titleId} className="space-y-8 rounded-xl bg-card p-5">
        <h3 id={titleId} className="sr-only">
          Filtros
        </h3>
        <FilterFields {...props} />
        <Button variant="outline" className="w-full" onClick={props.onClear} disabled={activeCount === 0}>
          Limpar filtros
        </Button>
      </section>
    )
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="self-start bg-primary/75 text-primary-foreground hover:bg-primary">
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          Filtros
          {activeCount > 0 && (
            <span className="rounded-full bg-background px-2 py-0.5 text-xs font-bold text-primary">
              {activeCount}
              <span className="sr-only"> {activeCount === 1 ? 'ativo' : 'ativos'}</span>
            </span>
          )}
        </Button>
      </SheetTrigger>

      {/* o Radix prende o foco dentro do Sheet e devolve ao botão "Filtros" ao fechar (Esc, X ou "Ver resultados") */}
      <SheetContent side="bottom" className="max-h-[85dvh] gap-0 rounded-t-2xl border-t bg-card">
        <SheetHeader className="pr-12">
          <SheetTitle className="text-lg">Filtros</SheetTitle>
          <SheetDescription>
            {activeCount > 0 ? `${activeCount} ${activeCount === 1 ? 'filtro ativo' : 'filtros ativos'}` : 'Refine os NFTs exibidos.'}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-8 overflow-y-auto px-4 pb-4">
          <FilterFields {...props} />
        </div>

        <SheetFooter className="flex-row border-t">
          <Button variant="outline" className="flex-1" onClick={props.onClear} disabled={activeCount === 0}>
            Limpar
          </Button>
          <SheetClose asChild>
            <Button className="flex-1">Ver resultados</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

/** campos compartilhados entre o painel (desktop) e o Sheet (mobile) */
function FilterFields({ value, onChange }: FilterPanelProps) {
  return (
    <>
      <CategoryField value={value.category} onChange={(category) => onChange({ category })} />
      <PriceField
        minPrice={value.minPrice}
        maxPrice={value.maxPrice}
        onApply={(minPrice, maxPrice) => onChange({ minPrice, maxPrice })}
      />
      <div className="space-y-3">
        <h4 className="font-bold">Disponibilidade</h4>
        <AvailabilityField checked={!!value.onlyAvailable} onChange={(on) => onChange({ onlyAvailable: on || undefined })} />
      </div>
    </>
  )
}

function CategoryField({ value, onChange }: { value?: NftCategory; onChange: (c: NftCategory | undefined) => void }) {
  const name = useId()
  const options: { value: NftCategory | undefined; label: string }[] = [
    { value: undefined, label: 'Todas' },
    ...NFT_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] })),
  ]

  return (
    <fieldset>
      <legend className="mb-3 font-bold">Coleções</legend>
      <div className="space-y-1">
        {options.map((option) => {
          const checked = option.value === value
          return (
            <label
              key={option.label}
              className={cn(
                'relative flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
                'hover:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                checked ? 'font-bold text-primary' : 'text-muted-foreground',
              )}
            >
              <input
                type="radio"
                name={name}
                checked={checked}
                onChange={() => onChange(option.value)}
                // cobre a linha, transparente: o radio nativo é o alvo do clique e do teclado
                className="absolute inset-0 z-10 m-0 cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
              />
              {option.label}
              {/* marcador de selecionado: não depende só da cor */}
              {checked && <Check aria-hidden="true" className="size-4" />}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

interface PriceFieldProps {
  minPrice?: string
  maxPrice?: string
  onApply: (min: string | undefined, max: string | undefined) => void
}

function PriceField({ minPrice = '', maxPrice = '', onApply }: PriceFieldProps) {
  const id = useId()
  const [min, setMin] = useState(minPrice)
  const [max, setMax] = useState(maxPrice)
  const [errors, setErrors] = useState<{ min?: string; max?: string }>({})
  const [prev, setPrev] = useState({ minPrice, maxPrice })

  // filtros mudaram por fora (limpar, histórico): alinha os campos
  if (prev.minPrice !== minPrice || prev.maxPrice !== maxPrice) {
    setPrev({ minPrice, maxPrice })
    setMin(minPrice)
    setMax(maxPrice)
    setErrors({})
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // aceita vírgula decimal (padrão brasileiro) e envia sempre com ponto
    const minValue = min.trim().replace(',', '.')
    const maxValue = max.trim().replace(',', '.')
    const next: typeof errors = {}

    if (minValue && !DECIMAL.test(minValue)) next.min = 'Use um número, ex.: 0,5'
    if (maxValue && !DECIMAL.test(maxValue)) next.max = 'Use um número, ex.: 2'
    if (!next.min && !next.max && minValue && maxValue && toDecimal(minValue).greaterThan(maxValue)) {
      next.max = 'O máximo deve ser maior ou igual ao mínimo'
    }

    setErrors(next)
    if (next.min || next.max) return
    onApply(minValue || undefined, maxValue || undefined)
  }

  const describedBy = (field: 'min' | 'max') => [`${id}-hint`, errors[field] && `${id}-${field}-error`].filter(Boolean).join(' ')

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-3">
      <h4 className="font-bold">Faixa de preço</h4>
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        Valores em ETH
      </p>
      <div className="grid grid-cols-2 gap-3">
        {(['min', 'max'] as const).map((field) => (
          <div key={field} className="space-y-1.5">
            <Label htmlFor={`${id}-${field}`} className="text-xs text-muted-foreground">
              {field === 'min' ? 'Mínimo' : 'Máximo'}
            </Label>
            <Input
              id={`${id}-${field}`}
              inputMode="decimal"
              autoComplete="off"
              placeholder={field === 'min' ? '0' : '∞'}
              value={field === 'min' ? min : max}
              onChange={(e) => (field === 'min' ? setMin : setMax)(e.target.value)}
              aria-invalid={!!errors[field]}
              aria-describedby={describedBy(field)}
              className="bg-background"
            />
            {errors[field] && (
              <p id={`${id}-${field}-error`} className="text-xs text-destructive">
                {errors[field]}
              </p>
            )}
          </div>
        ))}
      </div>
      <Button type="submit" size="sm">
        Aplicar
      </Button>
    </form>
  )
}

function AvailabilityField({ checked, onChange }: { checked: boolean; onChange: (on: boolean) => void }) {
  const id = useId()
  return (
    <div className="flex items-center gap-3">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
        Somente disponíveis
      </Label>
    </div>
  )
}
