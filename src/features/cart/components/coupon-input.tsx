import { useId, useState, type FormEvent } from 'react'
import { TicketPercent } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CouponInputProps {
  appliedCode: string | null
  error?: string
  isPending: boolean
  onApply: (code: string) => void
  onRemove: () => void
}

export function CouponInput({ appliedCode, error, isPending, onApply, onRemove }: CouponInputProps) {
  const id = useId()
  const [code, setCode] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (code.trim()) onApply(code.trim())
  }

  return (
    <div className="rounded-xl bg-card p-5">
      {/* o título visível é o próprio label do campo (sem cupom): um único nome acessível "Código promocional" */}
      {appliedCode ? (
        <h2 className="mb-3 text-sm font-bold">Código promocional</h2>
      ) : (
        <label htmlFor={id} className="mb-3 block text-sm font-bold">
          Código promocional
        </label>
      )}

      {appliedCode ? (
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm">
            <TicketPercent aria-hidden="true" className="size-4 text-primary" />
            Cupom <span className="font-mono font-bold text-primary">{appliedCode}</span> aplicado
          </p>
          <Button variant="outline" size="sm" onClick={onRemove} disabled={isPending}>
            Remover cupom
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex">
            <input
              id={id}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Digite o código promocional…"
              autoComplete="off"
              autoCapitalize="characters"
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : undefined}
              className="h-10 min-w-0 flex-1 rounded-l-md border border-r-0 border-input bg-background px-3 text-sm uppercase placeholder:normal-case placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none aria-invalid:border-destructive"
            />
            <Button type="submit" disabled={isPending} className="rounded-l-none">
              {isPending ? 'Aplicando…' : 'Aplicar'}
            </Button>
          </div>
          {error && (
            <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
