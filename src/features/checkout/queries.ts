import { queryOptions, useMutation } from '@tanstack/react-query'
import { toApiError } from '@/lib/http'
import { checkoutApi } from './api'

export const orderQueryOptions = (userId: string, orderId: string) =>
  queryOptions({
    queryKey: ['order', userId, orderId] as const,
    queryFn: ({ signal }) => checkoutApi.order(orderId, signal),
    // enquanto pendente, consulta a cada 2s; no passo 12 o socket acelera isso
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 2000 : false),
  })

export function useCreateOrder() {
  return useMutation({
    mutationFn: checkoutApi.createOrder,
    // a ÚNICA mutation com retry automático: é seguro porque toda tentativa reenvia a mesma Idempotency-Key
    retry: (failureCount, error) => failureCount < 2 && toApiError(error).code === 'SERVICE_UNAVAILABLE',
    retryDelay: 1000,
  })
}
