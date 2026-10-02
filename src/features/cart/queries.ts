import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Cart, Network } from '@/contracts'
import { useSession } from '@/features/auth/queries'
import { cartApi } from './api'

/** dono do carrinho; undefined enquanto a sessão carrega, para não cachear na chave errada */
export function useCartOwner() {
  const session = useSession()
  if (session.isPending) return undefined
  return session.data?.user.id ?? 'guest'
}

export const cartKeys = {
  cart: (owner: string) => ['cart', owner] as const,
  quotes: (owner: string) => ['quote', owner] as const,
  quote: (owner: string, network: Network) => ['quote', owner, network] as const,
}

export const cartQueryOptions = (owner: string) =>
  queryOptions({
    queryKey: cartKeys.cart(owner),
    queryFn: ({ signal }) => cartApi.get(signal),
  })

export const quoteQueryOptions = (owner: string, network: Network) =>
  queryOptions({
    queryKey: cartKeys.quote(owner, network),
    queryFn: ({ signal }) => cartApi.quote({ network }, signal),
    staleTime: 0, // cotação sempre fresca
  })

export function useCart() {
  const owner = useCartOwner()
  return useQuery({ ...cartQueryOptions(owner ?? ''), enabled: !!owner })
}

export function useCartCount() {
  return useCart().data?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0
}

function useCartMutation<TVars>(mutationFn: (vars: TVars) => Promise<Cart>) {
  const queryClient = useQueryClient()
  const owner = useCartOwner() ?? 'guest'

  return useMutation({
    mutationFn,
    // mutations com o mesmo scope rodam em fila: uma resposta antiga nunca sobrescreve uma nova
    scope: { id: 'cart' },
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.cart(owner), cart)
      void queryClient.invalidateQueries({ queryKey: cartKeys.quotes(owner) })
    },
    // em erro, busca o estado real do servidor
    onError: () => void queryClient.invalidateQueries({ queryKey: cartKeys.cart(owner) }),
  })
}

export const useAddToCart = () => useCartMutation(cartApi.add)
export const useSetCartQuantity = () => useCartMutation(cartApi.setQuantity)
export const useRemoveFromCart = () => useCartMutation(cartApi.remove)
export const useApplyCoupon = () => useCartMutation(cartApi.applyCoupon)
export const useRemoveCoupon = () => useCartMutation(() => cartApi.removeCoupon())
export const useAcknowledgeCart = () => useCartMutation(() => cartApi.acknowledge())
