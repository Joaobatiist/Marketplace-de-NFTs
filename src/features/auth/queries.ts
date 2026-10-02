import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
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

/**
 * Troca de usuário (login, cadastro, logout, sessão expirada): descarta o cache do usuário anterior
 * e grava a nova sessão. Não usar queryClient.clear(): ele apaga a query de sessão que o header
 * observa via useSession(), e o setQueryData seguinte cria outra que ninguém escuta — o header
 * só atualizaria depois de recarregar a página.
 */
export function replaceSession(queryClient: QueryClient, session: Session | null) {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== sessionQueryOptions.queryKey[0] })
  queryClient.setQueryData(sessionQueryOptions.queryKey, session)
}

/** login e cadastro: descarta cache anterior (dados de visitante) e grava a nova sessão */
function useAuthMutation<T>(mutationFn: (body: T) => ReturnType<typeof authApi.login>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: ({ token, session }) => {
      tokenStorage.set(token)
      replaceSession(queryClient, session)
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
      replaceSession(queryClient, null)
      await router.invalidate()
      await router.navigate({ to: '/' })
    },
  })
}