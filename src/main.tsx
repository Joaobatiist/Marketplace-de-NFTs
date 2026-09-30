import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { routeTree } from './routeTree.gen'
import './index.css'

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

async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const { worker } = await import('./mocks/browser')
  await worker.start({
    onUnhandledFrame({ frame, defaults }) {
      // frames podem ser HTTP ou WebSocket; só nos interessam requisições HTTP
      if (frame.protocol !== 'http') return
      const { request } = frame.data as { request: Request }
      // avisa só sobre chamadas de API esquecidas; ignora imagens, fontes etc.
      if (new URL(request.url).pathname.startsWith('/api')) defaults.warn()
    },
  })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
})