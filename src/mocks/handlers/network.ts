import { http, HttpResponse, delay } from 'msw'
import { latencyMs, scenario } from '../scenarios'
import { apiError } from '../utils'

export const networkHandlers = [
  http.all('/api/*', async ({ request }) => {
    const config = scenario.get()
    const { pathname } = new URL(request.url)
    if (pathname.startsWith('/api/__dev')) return

    await delay(latencyMs())

    // queda de conexão: o Axios recebe erro de rede (sem resposta)
    if (config.offline) return HttpResponse.error()

    if (config.failReads && request.method === 'GET' && !pathname.startsWith('/api/auth')) {
      return apiError(503, 'SERVICE_UNAVAILABLE', 'Serviço temporariamente indisponível. Tente novamente.')
    }

    if (config.failFavorites && pathname.startsWith('/api/favorites') && request.method !== 'GET') {
      return apiError(503, 'SERVICE_UNAVAILABLE', 'Não foi possível atualizar os favoritos.')
    }

    // sem retorno: o MSW segue para o handler real
  }),
]
