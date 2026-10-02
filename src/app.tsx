/*
 * Árvore da aplicação. Carregada pelo main.tsx com import() SÓ DEPOIS do MSW iniciar:
 * o engine.io-client (socket.io-client) guarda `globalThis.WebSocket` no momento em que o
 * módulo é avaliado. Se o app fosse importado estaticamente, o socket capturaria o WebSocket
 * nativo antes de o MSW substituí-lo, e a conexão tentaria a rede de verdade.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { routeTree } from './routeTree.gen'
import { setSessionExpiredHandler, tokenStorage } from '@/lib/http'
import { replaceSession } from '@/features/auth/queries'

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent', // pré-carrega a rota quando o mouse passa no link
  defaultPreloadStaleTime: 0, // deixa o cache do Query decidir, não o do Router
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

setSessionExpiredHandler(() => {
  tokenStorage.clear()
  replaceSession(queryClient, null)
  // reexecuta o beforeLoad das rotas: se a atual for protegida, manda para o login
  void router.invalidate()
})

export function renderApp() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}
