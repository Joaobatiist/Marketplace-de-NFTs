import { useId, useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthInputProps extends ComponentProps<'input'> {
  /** rótulo para leitor de tela: no Figma os campos só têm placeholder */
  label: string
  error?: string
  /** olho do Figma (riscado enquanto a senha está oculta) */
  revealable?: boolean
}

/**
 * Campo das telas Entrar/Criar conta (Figma): só placeholder na tela, rótulo real oculto
 * (o placeholder some ao digitar e não serve de rótulo). Erro associado por aria-describedby.
 */
export function AuthInput({ label, error, revealable, type = 'text', id: idProp, className, ...inputProps }: AuthInputProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  const [revealed, setRevealed] = useState(false)

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={revealable && revealed ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'h-[3.125rem] w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground lg:h-10 lg:rounded-[3px] lg:bg-transparent',
            'placeholder:text-muted-foreground',
            'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none',
            'aria-invalid:border-destructive',
            revealable && 'pr-12',
          )}
          {...inputProps}
        />
        {revealable && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-pressed={revealed}
            aria-controls={id}
            className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center text-primary/70 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {/* nome por texto oculto (e não aria-label): getByLabel('Senha') continua achando só o campo */}
            <span className="sr-only">Mostrar senha</span>
            {revealed ? <Eye aria-hidden="true" className="size-[1.125rem]" /> : <EyeOff aria-hidden="true" className="size-[1.125rem]" />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
