import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  quoteQueryOptions, useAcknowledgeCart, useApplyCoupon, useCart, useCartOwner,
  useRemoveCoupon, useRemoveFromCart, useSetCartQuantity,
} from '@/features/cart/queries'
import { toApiError } from '@/lib/http'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { CartItemRow, CartItemRowSkeleton } from '@/features/cart/components/cart-item-row'
import { CartSummary } from '@/features/cart/components/cart-summary'
import { CouponInput } from '@/features/cart/components/coupon-input'
import { PriceChangeAlert } from '@/features/cart/components/price-change-alert'

export const Route = createFileRoute('/cart')({ component: CartPage })

function CartPage() {
  const navigate = useNavigate()
  const owner = useCartOwner()
  const cart = useCart()
  const hasItems = !!cart.data?.items.length
  const quote = useQuery({ ...quoteQueryOptions(owner ?? '', 'ethereum'), enabled: !!owner && hasItems })

  const setQuantity = useSetCartQuantity()
  const remove = useRemoveFromCart()
  const applyCoupon = useApplyCoupon()
  const removeCoupon = useRemoveCoupon()
  const acknowledge = useAcknowledgeCart()
  const [couponError, setCouponError] = useState<string>()

  const showError = (error: unknown) => toast.error(toApiError(error).message)

  if (cart.isPending) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        {Array.from({ length: 3 }, (_, i) => <CartItemRowSkeleton key={i} />)}
      </div>
    )
  }

  if (!cart.data) {
    return <ErrorState message={toApiError(cart.error).message} onRetry={() => void cart.refetch()} />
  }

  if (!hasItems) {
    return (
      <EmptyState
        title="Seu carrinho está vazio"
        description="Explore o catálogo e adicione NFTs."
        actionLabel="Ver catálogo"
        onAction={() => void navigate({ to: '/' })}
      />
    )
  }

  const issues = quote.data?.issues ?? []
  const blocked = issues.length > 0 || !quote.data || quote.isFetching

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section aria-labelledby="cart-title" className="min-w-0 space-y-4">
        <h1 id="cart-title" className="text-2xl font-bold">Carrinho</h1>

        {issues.length > 0 && (
          <PriceChangeAlert
            issues={issues}
            items={cart.data.items}
            onAcknowledge={() => acknowledge.mutate(undefined, { onError: showError })}
            isPending={acknowledge.isPending}
          />
        )}

        <ul className="space-y-4">
          {cart.data.items.map((item) => (
            <li key={`${item.nftId}:${item.editionId}`}>
              <CartItemRow
                item={item}
                onQuantityChange={(quantity) =>
                  setQuantity.mutate({ nftId: item.nftId, editionId: item.editionId, quantity }, { onError: showError })
                }
                onRemove={() =>
                  remove.mutate(
                    { nftId: item.nftId, editionId: item.editionId },
                    { onSuccess: () => toast.success(`${item.name} removido do carrinho`), onError: showError },
                  )
                }
              />
            </li>
          ))}
        </ul>
      </section>

      <aside aria-label="Resumo do pedido" className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <CouponInput
          appliedCode={cart.data.couponCode}
          error={couponError}
          isPending={applyCoupon.isPending || removeCoupon.isPending}
          onApply={(code) =>
            applyCoupon.mutate(code, {
              onSuccess: () => {
                setCouponError(undefined)
                toast.success('Cupom aplicado')
              },
              onError: (error) => setCouponError(toApiError(error).message),
            })
          }
          onRemove={() => removeCoupon.mutate(undefined, { onError: showError })}
        />

        <CartSummary
          quote={quote.data}
          isLoading={quote.isPending}
          isUpdating={quote.isFetching && !quote.isPending}
          error={quote.isError ? toApiError(quote.error).message : undefined}
          onRetry={() => void quote.refetch()}
          checkoutDisabled={blocked}
          checkoutDisabledReason={issues.length > 0 ? 'Revise as alterações do carrinho para continuar.' : undefined}
          onCheckout={() => void navigate({ to: '/checkout' })}
        />
      </aside>
    </div>
  )
}
