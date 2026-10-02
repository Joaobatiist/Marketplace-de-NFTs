import { useMutation, useQueryClient } from '@tanstack/react-query'
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
