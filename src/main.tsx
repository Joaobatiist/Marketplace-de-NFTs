import './index.css'

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

// o app só é importado depois do MSW: ver o comentário no topo de app.tsx
enableMocking()
  .then(() => import('./app'))
  .then(({ renderApp }) => renderApp())
