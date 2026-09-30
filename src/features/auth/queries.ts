import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import type { Session } from '@/contracts'
import { tokenStorage, toApiError } from '@/lib/http'
import { authApi } from './api'

export const sessionQueryOptions = queryOptions({
  queryKey: ['session'] as const,
  queryFn: async (): Promise<Session | null> => {
    if (!tokenStorage.get()) return null
    try {
      return await authApi.session()
    } catch (error) {
      const { code } = toApiError(error)
      if (code === 'UNAUTHORIZED' || code === 'SESSION_EXPIRED') {
        tokenStorage.clear()
        return null
      }
      throw error
    }
  },
  staleTime: 5 * 60_000,
})

export function useSession() {
  return useQuery(sessionQueryOptions)
}

/** login e cadastro: descarta cache anterior (dados de visitante) e grava a nova sessão */
function useAuthMutation<T>(mutationFn: (body: T) => ReturnType<typeof authApi.login>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: ({ token, session }) => {
      tokenStorage.set(token)
      queryClient.clear()
      queryClient.setQueryData(sessionQueryOptions.queryKey, session)
    },
  })
}

export const useLogin = () => useAuthMutation(authApi.login)
export const useRegister = () => useAuthMutation(authApi.register)

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: () => authApi.logout().catch(() => undefined),
    onSettled: async () => {
      tokenStorage.clear()
      // TODO passo 11: desconectar o socket aqui
      queryClient.clear()
      queryClient.setQueryData(sessionQueryOptions.queryKey, null)
      await router.invalidate()
      await router.navigate({ to: '/' })
    },
  })
}