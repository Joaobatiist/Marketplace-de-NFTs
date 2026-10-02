import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { checkoutFormSchema, type CheckoutForm, type Session, type WalletConnection } from '@/contracts'
import { cartKeys, quoteQueryOptions, useAcknowledgeCart, useCart } from '@/features/cart/queries'
import { nftKeys } from '@/features/catalog/queries'
import { attemptStorage, type CheckoutAttempt } from '@/features/checkout/attempt'
import { orderQueryOptions, useCreateOrder } from '@/features/checkout/queries'
import { useConnectWallet, walletsQueryOptions } from '@/features/wallets/queries'
import { toApiError } from '@/lib/http'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { PriceChangeAlert } from '@/features/cart/components/price-change-alert'
import { CheckoutSteps } from '@/features/checkout/components/checkout-steps'
import { CheckoutSkeleton } from '@/features/checkout/components/checkout-skeleton'
import { WalletNetworkSelector } from '@/features/checkout/components/wallet-network-selector'
import { WalletConnectionStatus } from '@/features/checkout/components/wallet-connection-status'
import { OrderReview } from '@/features/checkout/components/order-review'
import { OrderStatusView } from '@/features/checkout/components/order-status-view'

export const Route = createFileRoute('/_auth/checkout')({ component: CheckoutPage })

function CheckoutPage() {
  const { session } = Route.useRouteContext()
  const userId = session.user.id
  // lido só na montagem: recupera uma tentativa interrompida por refresh
  const [attempt, setAttempt] = useState(() => attemptStorage.get(userId))

  const restart = () => {
    attemptStorage.clear()
    setAttempt(null)
  }

  if (attempt?.orderId) return <OrderProgress userId={userId} orderId={attempt.orderId} onRestart={restart} />
  if (attempt) return <ResumeAttempt attempt={attempt} onResolved={setAttempt} onRestart={restart} />
  return <CheckoutFlow session={session} onOrderCreated={setAttempt} />
}

/** a página caiu depois do envio: reenvia a MESMA chave; se o pedido já existe, o servidor devolve o mesmo */
function ResumeAttempt({
  attempt,
  onResolved,
  onRestart,
}: {
  attempt: CheckoutAttempt
  onResolved: (a: CheckoutAttempt) => void
  onRestart: () => void
}) {
  const createOrder = useCreateOrder()

  useEffect(() => {
    createOrder.mutate(
      { idempotencyKey: attempt.idempotencyKey, body: attempt.request },
      {
        onSuccess: (order) => {
          const next = { ...attempt, orderId: order.id }
          attemptStorage.set(next)
          onResolved(next)
        },
        onError: (error) => {
          toast.error(toApiError(error).message)
          onRestart()
        },
      },
    )
    // roda só uma vez; mesmo se o StrictMode repetir, a idempotência evita duplicar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <OrderStatusView status="checking" />
}

function OrderProgress({ userId, orderId, onRestart }: { userId: string; orderId: string; onRestart: () => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const order = useQuery(orderQueryOptions(userId, orderId))
  const status = order.data?.status

  useEffect(() => {
    if (status !== 'confirmed' && status !== 'declined') return
    // estoque e carrinho mudaram no servidor
    void queryClient.invalidateQueries({ queryKey: cartKeys.cart(userId) })
    void queryClient.invalidateQueries({ queryKey: cartKeys.quotes(userId) })
    void queryClient.invalidateQueries({ queryKey: nftKeys.all })
    if (status === 'confirmed') {
      attemptStorage.clear()
      void navigate({ to: '/orders/$orderId', params: { orderId }, replace: true })
    }
  }, [status, userId, orderId, navigate, queryClient])

  if (order.isPending) return <OrderStatusView status="pending" />

  if (!order.data) {
    return <ErrorState message={toApiError(order.error).message} onRetry={() => void order.refetch()} />
  }

  return (
    <OrderStatusView
      status={order.data.status}
      declineReason={order.data.declineReason}
      onRetry={onRestart}
      onBackToCart={() => {
        attemptStorage.clear()
        void navigate({ to: '/cart' })
      }}
    />
  )
}

function CheckoutFlow({ session, onOrderCreated }: { session: Session; onOrderCreated: (a: CheckoutAttempt) => void }) {
  const userId = session.user.id
  const navigate = useNavigate()
  const cart = useCart()
  const wallets = useQuery(walletsQueryOptions(userId))
  const connectWallet = useConnectWallet()
  const createOrder = useCreateOrder()
  const acknowledge = useAcknowledgeCart()

  const [step, setStep] = useState<'details' | 'review'>('details')
  const [connection, setConnection] = useState<WalletConnection | null>(null)
  const [connectError, setConnectError] = useState<string>()

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { name: session.user.name, email: session.user.email, walletId: '' },
  })
  const { errors } = form.formState
  const walletId = form.watch('walletId')
  const network = form.watch('network')
  const wallet = wallets.data?.find((w) => w.id === walletId)
  // trocar carteira ou rede invalida a conexão anterior
  const isConnected = !!connection && connection.walletId === walletId && connection.network === network

  const quote = useQuery({
    ...quoteQueryOptions(userId, network ?? 'ethereum'),
    enabled: step === 'review' && !!network,
  })

  // uma chave por cotação: clique duplo ou reenvio usam a mesma; cotação nova gera chave nova
  const keyRef = useRef<{ quoteId: string; key: string } | null>(null)
  const idempotencyKeyFor = (quoteId: string) => {
    if (keyRef.current?.quoteId !== quoteId) keyRef.current = { quoteId, key: crypto.randomUUID() }
    return keyRef.current.key
  }

  if (cart.isPending || wallets.isPending) return <CheckoutSkeleton />

  if (!cart.data || !wallets.data) {
    return (
      <ErrorState
        message="Não foi possível carregar o pagamento."
        onRetry={() => {
          void cart.refetch()
          void wallets.refetch()
        }}
      />
    )
  }

  if (cart.data.items.length === 0) {
    return <EmptyState title="Seu carrinho está vazio" actionLabel="Ver catálogo" onAction={() => void navigate({ to: '/' })} />
  }

  if (wallets.data.length === 0) {
    return (
      <EmptyState
        title="Cadastre uma carteira"
        description="Você precisa de uma carteira para concluir a compra."
        actionLabel="Cadastrar carteira"
        onAction={() => void navigate({ to: '/wallets' })}
      />
    )
  }

  const handleConnect = () => {
    if (!walletId || !network) return
    setConnectError(undefined)
    connectWallet.mutate(
      { walletId, network },
      {
        onSuccess: setConnection,
        onError: (error) => {
          setConnection(null)
          setConnectError(toApiError(error).message)
        },
      },
    )
  }

  const goToReview = form.handleSubmit(() => {
    if (!isConnected) {
      setConnectError('Conecte a carteira para continuar.')
      return
    }
    setStep('review')
  })

  const issues = quote.data?.issues ?? []
  const canConfirm = !!quote.data && issues.length === 0 && isConnected && !quote.isFetching && !createOrder.isPending

  const handleConfirm = () => {
    if (!canConfirm || !quote.data || !network) return
    const { name, email } = form.getValues()
    const attempt: CheckoutAttempt = {
      userId,
      idempotencyKey: idempotencyKeyFor(quote.data.id),
      request: { quoteId: quote.data.id, walletId, network, buyer: { name, email } },
    }
    attemptStorage.set(attempt) // salva ANTES de enviar: se a página cair, a tentativa é recuperada

    createOrder.mutate(
      { idempotencyKey: attempt.idempotencyKey, body: attempt.request },
      {
        onSuccess: (order) => {
          const next = { ...attempt, orderId: order.id }
          attemptStorage.set(next)
          onOrderCreated(next)
        },
        onError: (error) => {
          const apiError = toApiError(error)
          // falha de rede: mantém a tentativa (mesma chave) para recuperar no próximo clique ou refresh
          if (apiError.code !== 'SERVICE_UNAVAILABLE') attemptStorage.clear()
          toast.error(apiError.message)
          if (apiError.code === 'QUOTE_OUTDATED') void quote.refetch()
        },
      },
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-bold">Pagamento</h1>
      <CheckoutSteps current={step} />

      {step === 'details' ? (
        <form onSubmit={goToReview} noValidate className="space-y-8">
          <fieldset className="space-y-4">
            <legend className="mb-2 text-lg font-semibold">Dados do colecionador</legend>

            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                autoComplete="name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                {...form.register('name')}
              />
              {errors.name && <p id="name-error" className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...form.register('email')}
              />
              {errors.email && <p id="email-error" className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
          </fieldset>

          <WalletNetworkSelector
            wallets={wallets.data}
            walletId={walletId}
            network={network}
            onWalletChange={(id) => {
              form.setValue('walletId', id, { shouldValidate: true })
              form.resetField('network')
            }}
            onNetworkChange={(n) => form.setValue('network', n, { shouldValidate: true })}
            walletError={errors.walletId?.message}
            networkError={errors.network?.message}
          />

          <WalletConnectionStatus
            status={connectWallet.isPending ? 'connecting' : isConnected ? 'connected' : connectError ? 'error' : 'disconnected'}
            walletLabel={wallet?.label}
            error={connectError}
            canConnect={!!walletId && !!network}
            onConnect={handleConnect}
            onDisconnect={() => setConnection(null)}
          />

          <Button type="submit" className="w-full sm:w-auto">Revisar pedido</Button>
        </form>
      ) : (
        <div className="space-y-6">
          {issues.length > 0 && (
            <PriceChangeAlert
              issues={issues}
              items={cart.data.items}
              onAcknowledge={() => acknowledge.mutate(undefined)}
              isPending={acknowledge.isPending}
            />
          )}

          <OrderReview
            quote={quote.data}
            isLoading={quote.isPending}
            isUpdating={quote.isFetching && !quote.isPending}
            buyer={{ name: form.getValues('name'), email: form.getValues('email') }}
            walletLabel={wallet?.label ?? ''}
            network={network!}
          />

          {!isConnected && (
            <p role="alert" className="text-sm text-destructive">
              A carteira foi desconectada. Volte e conecte novamente para confirmar.
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setStep('details')} disabled={createOrder.isPending}>
              Voltar
            </Button>
            <Button onClick={handleConfirm} disabled={!canConfirm}>
              {createOrder.isPending ? 'Enviando pedido…' : 'Confirmar compra'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
