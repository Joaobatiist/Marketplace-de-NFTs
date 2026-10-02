import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { couponsQueryOptions } from '@/features/account/queries'
import { useApplyCoupon, useCart } from '@/features/cart/queries'
import { AccountHeading } from '@/features/account/components/account-heading'
import { CouponCard, CouponCardSkeleton } from '@/features/account/components/coupon-card'
import { toApiError } from '@/lib/http'
import { ErrorState } from '@/components/feedback/error-state'

export const Route = createFileRoute('/_auth/_account/offers')({ component: OffersPage })

const gridClass = 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'

function OffersPage() {
  const coupons = useQuery(couponsQueryOptions)
  const cart = useCart()
  const apply = useApplyCoupon()
  const navigate = Route.useNavigate()

  const handleApply = (code: string) =>
    apply.mutate(code, {
      onSuccess: () =>
        toast.success(`Cupom ${code} aplicado`, {
          action: { label: 'Ver carrinho', onClick: () => void navigate({ to: '/cart' }) },
        }),
      onError: (error) => toast.error(toApiError(error).message),
    })

  function renderContent() {
    if (coupons.isPending) {
      return (
        <div role="status">
          <span className="sr-only">Carregando ofertas…</span>
          <div aria-hidden="true" className={gridClass}>
            <CouponCardSkeleton />
            <CouponCardSkeleton />
          </div>
        </div>
      )
    }
    if (!coupons.data) return <ErrorState message={toApiError(coupons.error).message} onRetry={() => void coupons.refetch()} />

    return (
      <ul className={gridClass}>
        {coupons.data.map((coupon) => (
          <li key={coupon.code}>
            <CouponCard
              coupon={coupon}
              applied={cart.data?.couponCode === coupon.code}
              isApplying={apply.isPending && apply.variables === coupon.code}
              onApply={() => handleApply(coupon.code)}
            />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="space-y-8">
      <AccountHeading
        title="Ofertas"
        description={
          <>
            Cupons de desconto disponíveis para você. O cupom vale para o carrinho inteiro e é conferido de novo no{' '}
            <Link to="/cart" className="rounded-sm text-primary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              carrinho
            </Link>
            .
          </>
        }
      />
      {renderContent()}
    </div>
  )
}
