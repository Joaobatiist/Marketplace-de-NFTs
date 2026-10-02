import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  NETWORKS, WALLET_PROVIDERS, walletFormSchema, type ApiError, type WalletFormOutput, type WalletFormValues,
} from '@/contracts'
import { NETWORK_LABELS, WALLET_PROVIDER_LABELS } from '@/features/checkout/format'
import { cn } from '@/lib/utils'
import { AccountField, AccountSelect, FieldError, FormAlert } from '@/features/account/components/form-controls'
import { controlClass, submitButtonClass } from '@/features/account/form-styles'

interface WalletFormProps {
  defaultValues: WalletFormValues
  /** envia para a API; devolve o erro (fieldErrors vão para os campos) ou null no sucesso */
  onSubmit: (values: WalletFormOutput) => Promise<ApiError | null>
}

const NETWORK_OPTIONS = NETWORKS.map((n) => ({ value: n, label: NETWORK_LABELS[n] }))
const PROVIDER_OPTIONS = WALLET_PROVIDERS.map((p) => ({ value: p, label: WALLET_PROVIDER_LABELS[p] }))

/** erros da API → campos do formulário (a API fala em `networks`; a tela tem um select de rede) */
const FIELD_FROM_API: Record<string, keyof WalletFormValues> = { networks: 'network' }

/**
 * Formulário inline da tela Carteiras (Figma): apelido, rede, endereço, ENS opcional e tipo.
 * Estado local; dados entram e saem só por props.
 */
export function WalletForm({ defaultValues, onSubmit }: WalletFormProps) {
  const ensId = useId()
  const form = useForm<WalletFormValues, unknown, WalletFormOutput>({ resolver: zodResolver(walletFormSchema), defaultValues })
  const { errors, isSubmitting } = form.formState

  const submit = form.handleSubmit(async (values) => {
    const apiError = await onSubmit(values)
    if (!apiError) return
    const fields = Object.entries(apiError.fieldErrors ?? {}).filter(([field]) => field !== 'role')
    fields.forEach(([field, message]) => form.setError(FIELD_FROM_API[field] ?? (field as keyof WalletFormValues), { message }))
    if (fields.length === 0) form.setError('root', { message: apiError.fieldErrors?.role ?? apiError.message })
  })

  return (
    <form onSubmit={submit} noValidate className="grid gap-x-7 gap-y-8 md:grid-cols-2">
      {errors.root && (
        <div className="md:col-span-2">
          <FormAlert>{errors.root.message}</FormAlert>
        </div>
      )}

      <AccountField label="Apelido da carteira" required autoComplete="off" error={errors.label?.message} {...form.register('label')} />
      <AccountSelect
        label="Rede"
        required
        placeholder="Selecione uma rede"
        options={NETWORK_OPTIONS}
        error={errors.network?.message}
        {...form.register('network')}
      />
      <AccountField
        label="Endereço da carteira"
        required
        autoComplete="off"
        spellCheck={false}
        placeholder="Endereço 0x da carteira"
        error={errors.address?.message}
        {...form.register('address')}
      />
      {/* no Figma este campo só tem placeholder: o rótulo fica para o leitor de tela e o espaço dele é mantido */}
      <div className="space-y-3">
        <label htmlFor={ensId} className="sr-only">
          ENS ou carteira secundária (opcional)
        </label>
        {/* mesma altura do rótulo com asterisco: o campo alinha com o "Endereço da carteira" ao lado */}
        <div aria-hidden="true" className="hidden h-[1.125rem] md:block" />
        <input
          id={ensId}
          autoComplete="off"
          spellCheck={false}
          placeholder="ENS ou carteira secundária (opcional)"
          aria-invalid={!!errors.ens}
          aria-describedby={errors.ens ? `${ensId}-error` : undefined}
          className={controlClass}
          {...form.register('ens')}
        />
        <FieldError id={`${ensId}-error`}>{errors.ens?.message}</FieldError>
      </div>
      <AccountSelect
        label="Tipo de carteira"
        required
        placeholder="Selecione uma carteira"
        options={PROVIDER_OPTIONS}
        error={errors.provider?.message}
        {...form.register('provider')}
      />

      <div className="md:col-start-1">
        <button type="submit" disabled={isSubmitting} className={cn(submitButtonClass, 'px-2')}>
          {isSubmitting ? 'Salvando…' : 'Salvar carteira'}
        </button>
      </div>
    </form>
  )
}
