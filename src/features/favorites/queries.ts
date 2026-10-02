import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useSession } from '@/features/auth/queries'
import { favoritesApi } from './api'

// o id do usuário na chave isola os dados: usuário B nunca lê o cache do usuário A
export const favoritesKey = (userId: string) => ['favorites', userId] as const

export const favoritesQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: favoritesKey(userId),
    queryFn: ({ signal }) => favoritesApi.list(signal),
  })

interface ToggleVars {
  nftId: string
  favorite: boolean
}

function useToggleFavoriteMutation(userId: string) {
  const queryClient = useQueryClient()
  const key = favoritesKey(userId)

  return useMutation({
    mutationKey: ['toggle-favorite', userId],
    mutationFn: ({ nftId, favorite }: ToggleVars) =>
      favorite ? favoritesApi.add(nftId) : favoritesApi.remove(nftId),

    // 1. atualiza a tela na hora, antes da resposta
    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: key }) // evita um refetch em andamento sobrescrever
      const previous = queryClient.getQueryData<string[]>(key)
      queryClient.setQueryData<string[]>(key, (old = []) =>
        favorite ? [...new Set([...old, nftId])] : old.filter((id) => id !== nftId),
      )
      return { previous }
    },

    // 2. se falhar, volta ao estado anterior e avisa
    onError: (_error, { favorite }, context) => {
      queryClient.setQueryData(key, context?.previous)
      toast.error(favorite ? 'Não foi possível favoritar.' : 'Não foi possível remover dos favoritos.')
    },

    // 3. sincroniza com o servidor, mas só quando a última mutation em sequência terminar
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: ['toggle-favorite', userId] }) === 1) {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })
}

/** hook usado pelos componentes: resolve sessão, estado e redirecionamento */
export function useFavorite(nftId: string) {
  const { data: session } = useSession()
  const userId = session?.user.id ?? ''
  const navigate = useNavigate()
  const location = useLocation()

  const favorites = useQuery({ ...favoritesQueryOptions(userId), enabled: !!userId })
  const mutation = useToggleFavoriteMutation(userId)
  const isFavorite = favorites.data?.includes(nftId) ?? false

  const toggle = () => {
    if (!userId) {
      void navigate({ to: '/login', search: { redirect: location.href } })
      return
    }
    mutation.mutate({ nftId, favorite: !isFavorite })
  }

  return { isFavorite, toggle }
}