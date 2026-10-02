import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ChevronDown, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { controlClass } from '../form-styles'

/*
 * Controles das telas "Meu perfil" (Figma: Perfil do colecionador, Carteiras): rótulo acima com
 * asterisco nos obrigatórios, campo de cantos quase retos sobre o fundo da página e erro associado
 * (aria-invalid + aria-describedby). O asterisco é visual; o campo leva aria-required.
 */

export function RequiredLabel({ htmlFor, id, required, children }: { htmlFor?: string; id?: string; required?: boolean; children: ReactNode }) {
  return (
    // altura fixa (a do asterisco): rótulos com e sem asterisco alinham lado a lado
    <label htmlFor={htmlFor} id={id} className="flex h-[1.125rem] items-end text-[0.9375rem] leading-none">
      {children}
      {required && (
        <span aria-hidden="true" className="ml-0.5 text-lg leading-none text-destructive">
          *
        </span>
      )}
    </label>
  )
}

export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null
  return (
    <p id={id} className="text-sm text-destructive">
      {children}
    </p>
  )
}

interface AccountFieldProps extends Omit<ComponentProps<'input'>, 'required'> {
  label: string
  required?: boolean
  error?: string
  /** campo de senha com o olho do Figma (riscado enquanto a senha está oculta) */
  revealable?: boolean
}

export function AccountField({ label, required, error, revealable, id: idProp, type = 'text', className, ...inputProps }: AccountFieldProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  const [revealed, setRevealed] = useState(false)

  return (
    <div className={cn('space-y-3', className)}>
      <RequiredLabel htmlFor={id} required={required}>
        {label}
      </RequiredLabel>
      <div className="relative">
        <input
          id={id}
          type={revealable && revealed ? 'text' : type}
          aria-required={required || undefined}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(controlClass, revealable && 'pr-11')}
          {...inputProps}
        />
        {revealable && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-pressed={revealed}
            // nome genérico + aria-controls: o rótulo do campo não pode nomear dois elementos
            aria-label="Mostrar senha"
            aria-controls={id}
            className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-primary/80 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {revealed ? <Eye aria-hidden="true" className="size-[1.125rem]" /> : <EyeOff aria-hidden="true" className="size-[1.125rem]" />}
          </button>
        )}
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

interface AccountSelectProps extends Omit<ComponentProps<'select'>, 'required'> {
  label: string
  required?: boolean
  error?: string
  placeholder: string
  options: readonly { value: string; label: string }[]
}

/** select nativo (teclado e leitor de tela de graça) com a seta do Figma */
export function AccountSelect({ label, required, error, placeholder, options, id: idProp, className, ...selectProps }: AccountSelectProps) {
  const autoId = useId()
  const id = idProp ?? autoId

  return (
    <div className={cn('space-y-3', className)}>
      <RequiredLabel htmlFor={id} required={required}>
        {label}
      </RequiredLabel>
      <div className="relative">
        <select
          id={id}
          aria-required={required || undefined}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(controlClass, 'cursor-pointer appearance-none pr-10 invalid:text-muted-foreground')}
          required={required}
          {...selectProps}
        >
          {/* obrigatório: o placeholder não volta a ser escolhível; opcional: ele é o "nenhum" */}
          <option value="" disabled={required}>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value} className="text-foreground">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

interface EnsFieldProps {
  error?: string
  required?: boolean
  suffixes: readonly string[]
  labelProps: ComponentProps<'input'>
  suffixProps: ComponentProps<'select'>
}

/** "Nome ENS" do Figma: terminação (.eth) num select curto + nome ao lado */
export function EnsField({ error, required, suffixes, labelProps, suffixProps }: EnsFieldProps) {
  const id = useId()

  return (
    <div className="space-y-3">
      <RequiredLabel htmlFor={id} required={required}>
        Nome ENS
      </RequiredLabel>
      <div className="flex gap-2.5">
        <div className="relative shrink-0">
          <select aria-label="Terminação do nome ENS" className={cn(controlClass, 'w-[4.875rem] cursor-pointer appearance-none pr-7')} {...suffixProps}>
            {suffixes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2" />
        </div>
        <input
          id={id}
          autoComplete="off"
          spellCheck={false}
          aria-required={required || undefined}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={controlClass}
          {...labelProps}
        />
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

export function FormAlert({ children }: { children?: ReactNode }) {
  if (!children) return null
  return (
    <p role="alert" className="rounded-[3px] border border-destructive p-3 text-sm text-destructive">
      {children}
    </p>
  )
}
