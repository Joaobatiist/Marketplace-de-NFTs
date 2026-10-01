import { queryOptions, useMutation } from '@tanstack/react-query'
import { walletsApi } from './api'

export const walletsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['wallets', userId] as const,
    queryFn: ({ signal }) => walletsApi.list(signal),
  })

export const useConnectWallet = () => useMutation({ mutationFn: walletsApi.connect })
