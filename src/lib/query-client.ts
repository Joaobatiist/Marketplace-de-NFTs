import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30s: evita refetch a cada troca de tela
      retry: (failureCount, error) => {
        // erro 4xx (não encontrado, sem permissão) não adianta repetir
        if (isAxiosError(error) && error.response && error.response.status < 500) {
          return false
        }
        return failureCount < 2
      },
    },
    mutations: {
      retry: false, // nunca repetir mutation automaticamente (evita pedido duplicado)
    },
  },
})