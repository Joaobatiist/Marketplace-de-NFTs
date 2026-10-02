import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UpsertWalletRequest } from '@/contracts'
import { walletsApi } from './api'

export const walletsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['wallets', userId] as const,
    queryFn: ({ signal }) => walletsApi.list(signal),
  })

export const useConnectWallet = () => useMutation({ mutationFn: walletsApi.connect })

export function useSaveWallet(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: UpsertWalletRequest & { id?: string }) =>
      vars.id ? walletsApi.update({ ...vars, id: vars.id }) : walletsApi.create(vars),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['wallets', userId] }),
  })
}
