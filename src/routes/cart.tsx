import { createFileRoute } from '@tanstack/react-router'

// pública: visitante também tem carrinho (X-Guest-Id); a tela real entra no passo do carrinho
export const Route = createFileRoute('/cart')({
  component: () => <h1 className="p-8 text-2xl">Carrinho</h1>,
})
