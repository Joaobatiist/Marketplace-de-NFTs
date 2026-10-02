import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { NETWORKS, walletSchema, type ApiError, type WalletForm as WalletFormValues } from '@/contracts'
import { cn } from '@/lib/utils'
import { Field } from '@/components/form/field'
import { Button } from '@/components/ui/button'
import { NETWORK_LABELS, WALLET_ROLE_LABELS } from '@/features/checkout/format'

interface WalletFormProps {
  defaultValues: WalletFormValues
  submitLabel: string
  /** envia para a API; devolve o erro (fieldErrors vão para os campos) ou null no sucesso */
  onSubmit: (values: WalletFormValues) => Promise<ApiError | null>
  onCancel: () => void
}

/**
 * Formulário de carteira (walletSchema): rótulo, endereço, papel (radiogroup) e redes (checkboxes).
 * Estado do formulário é local; os dados chegam e saem só por props.
 */
export function WalletForm({ defaultValues, submitLabel, onSubmit, onCancel }: WalletFormProps) {
  const id = useId()
  const form = useForm<WalletFormValues>({ resolver: zodResolver(walletSchema), defaultValues })
  const { errors, isSubmitting } = form.formState

  const submit = form.handleSubmit(async (values) => {
    const apiError = await onSubmit(values)
    if (!apiError) return
    Object.entries(apiError.fieldErrors ?? {}).forEach(([field, message]) =>
      form.setError(field as keyof WalletFormValues, { message }),
    )
    if (!apiError.fieldErrors) form.setError('root', { message: apiError.message })
  })

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {errors.root && (
        <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <Field label="Nome da carteira" autoComplete="off" error={errors.label?.message} {...form.register('label')} />
      <Field
        label="Endereço"
        autoComplete="off"
        spellCheck={false}
        placeholder="0x…"
        hint="0x seguido de 40 caracteres hexadecimais"
        className="[&_input]:font-mono"
        error={errors.address?.message}
        {...form.register('address')}
      />

      <fieldset aria-describedby={errors.role ? `${id}-role-error` : undefined}>
        <legend className="mb-2 text-sm font-medium">Papel</legend>
        <div className="flex flex-wrap gap-2">
          {(['primary', 'secondary'] as const).map((role) => (
            <label
              key={role}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-input px-4 py-2 text-sm has-[:checked]:border-primary has-[:checked]:font-bold has-[:checked]:text-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <input type="radio" value={role} className="accent-[var(--color-primary)]" {...form.register('role')} />
              {WALLET_ROLE_LABELS[role]}
            </label>
          ))}
        </div>
        {errors.role && (
          <p id={`${id}-role-error`} className="mt-2 text-sm text-destructive">
            {errors.role.message}
          </p>
        )}
      </fieldset>

      <fieldset aria-describedby={errors.networks ? `${id}-networks-error` : undefined}>
        <legend className="mb-2 text-sm font-medium">Redes</legend>
        <div className="flex flex-wrap gap-2">
          {NETWORKS.map((network) => (
            <label
              key={network}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm',
                'has-[:checked]:border-primary has-[:checked]:text-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
              )}
            >
              <input type="checkbox" value={network} className="accent-[var(--color-primary)]" {...form.register('networks')} />
              {NETWORK_LABELS[network]}
            </label>
          ))}
        </div>
        {errors.networks && (
          <p id={`${id}-networks-error`} className="mt-2 text-sm text-destructive">
            {errors.networks.message}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
