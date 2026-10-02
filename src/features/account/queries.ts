import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@/contracts'
import { sessionQueryOptions } from '@/features/auth/queries'
import { accountApi } from './api'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: accountApi.update,
    onSuccess: (user) => {
      // o header e o checkout leem o usuário da sessão: atualiza na hora
      queryClient.setQueryData<Session | null>(sessionQueryOptions.queryKey, (old) => (old ? { ...old, user } : old))
    },
  })
}

export const useChangePassword = () => useMutation({ mutationFn: accountApi.changePassword })

/** pedidos do usuário (Atividade, Arquivos baixados); o id na chave isola os dados entre usuários */
export const ordersQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['orders', userId] as const,
    queryFn: ({ signal }) => accountApi.orders(signal),
    // pedido pendente vira confirmado/recusado em segundos: acompanha enquanto houver algum
    refetchInterval: (query) => (query.state.data?.some((o) => o.status === 'pending') ? 2000 : false),
  })

export const couponsQueryOptions = queryOptions({
  queryKey: ['coupons'] as const,
  queryFn: ({ signal }) => accountApi.coupons(signal),
})

export const useSendSupport = () => useMutation({ mutationFn: accountApi.support })
