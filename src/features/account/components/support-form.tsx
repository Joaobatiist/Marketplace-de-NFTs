import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  SUPPORT_TOPICS, supportSchema,
  type ApiError, type Order, type SupportForm as SupportFormValues, type SupportFormInput,
} from '@/contracts'
import { cn } from '@/lib/utils'
import { controlClass, submitButtonClass } from '../form-styles'
import { SUPPORT_TOPIC_LABELS } from '../format'
import { AccountSelect, FieldError, FormAlert, RequiredLabel } from './form-controls'

const TOPIC_OPTIONS = SUPPORT_TOPICS.map((t) => ({ value: t, label: SUPPORT_TOPIC_LABELS[t] }))

interface SupportFormProps {
  orders: Order[]
  /** envia; devolve o erro (fieldErrors vão para os campos) ou null no sucesso (o formulário limpa) */
  onSubmit: (values: SupportFormValues) => Promise<ApiError | null>
}

export function SupportForm({ orders, onSubmit }: SupportFormProps) {
  const messageId = useId()
  const form = useForm<SupportFormInput, unknown, SupportFormValues>({
    resolver: zodResolver(supportSchema),
    defaultValues: { topic: '', orderId: '', message: '' },
  })
  const { errors, isSubmitting } = form.formState

  const submit = form.handleSubmit(async (values) => {
    const apiError = await onSubmit({ ...values, orderId: values.orderId || null })
    if (!apiError) return form.reset()
    Object.entries(apiError.fieldErrors ?? {}).forEach(([field, message]) => form.setError(field as keyof SupportFormInput, { message }))
    if (!apiError.fieldErrors) form.setError('root', { message: apiError.message })
  })

  return (
    <form onSubmit={submit} noValidate className="grid gap-x-7 gap-y-8 md:grid-cols-2">
      {errors.root && (
        <div className="md:col-span-2">
          <FormAlert>{errors.root.message}</FormAlert>
        </div>
      )}
      <AccountSelect
        label="Assunto"
        required
        placeholder="Selecione um assunto"
        options={TOPIC_OPTIONS}
        error={errors.topic?.message}
        {...form.register('topic')}
      />
      <AccountSelect
        label="Pedido relacionado (opcional)"
        placeholder={orders.length ? 'Nenhum' : 'Você ainda não tem pedidos'}
        options={orders.map((o) => ({ value: o.id, label: `${o.id} · ${o.lines[0]?.name ?? ''}${o.lines.length > 1 ? ` +${o.lines.length - 1}` : ''}` }))}
        disabled={orders.length === 0}
        error={errors.orderId?.message}
        {...form.register('orderId')}
      />
      <div className="space-y-3 md:col-span-2">
        <RequiredLabel htmlFor={messageId} required>
          Mensagem
        </RequiredLabel>
        <textarea
          id={messageId}
          rows={6}
          aria-required
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? `${messageId}-error` : undefined}
          placeholder="Conte o que aconteceu. Se for sobre uma compra, diga o que esperava e o que viu na tela."
          className={cn(controlClass, 'h-auto resize-y py-2.5 leading-relaxed')}
          {...form.register('message')}
        />
        <FieldError id={`${messageId}-error`}>{errors.message?.message}</FieldError>
      </div>
      <div>
        <button type="submit" disabled={isSubmitting} className={submitButtonClass}>
          {isSubmitting ? 'Enviando…' : 'Enviar'}
        </button>
      </div>
    </form>
  )
}
