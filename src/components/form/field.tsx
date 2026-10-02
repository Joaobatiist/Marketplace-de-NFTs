import { useId, useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FieldProps extends ComponentProps<'input'> {
  label: string
  error?: string
  hint?: string
  /** campo de senha com botão "Mostrar senha" (ícone de olho do Figma) */
  revealable?: boolean
}

/**
 * Rótulo + campo + erro associado (aria-invalid / aria-describedby). Aceita o spread do
 * `form.register()` (no React 19 o `ref` chega como prop e vai direto para o input).
 */
export function Field({ label, error, hint, revealable, id: idProp, type = 'text', className, ...inputProps }: FieldProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  const [revealed, setRevealed] = useState(false)
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={revealable && revealed ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(revealable && 'pr-11')}
          {...inputProps}
        />
        {revealable && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-pressed={revealed}
            // nome genérico + aria-controls: o rótulo do campo não pode estar no nome do botão
            // (senão "Senha atual" passa a nomear dois elementos)
            aria-label="Mostrar senha"
            aria-controls={id}
            className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {revealed ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
          </button>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
