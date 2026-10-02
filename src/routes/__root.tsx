import { createRootRouteWithContext, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient } from "@tanstack/react-query";
import { useLogout, useSession } from "@/features/auth/queries";
import { useCartCount } from '@/features/cart/queries'
import { useRealtime } from '@/features/realtime/use-realtime'
import { RealtimeStatusBanner } from '@/features/realtime/components/realtime-status-banner'
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Toaster } from 'sonner'

interface RootRouteContext {
    queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RootRouteContext>()({
    component: RootLayout,
    notFoundComponent: NotFound,
});

function RootLayout() {
  const session = useSession()
  const logout = useLogout()
  const navigate = useNavigate()
  const user = session.data ? session.data.user : null
  const cartCount = useCartCount()
  const realtimeStatus = useRealtime()

  return (
    // pb-16: espaço para a barra inferior fixa do mobile não cobrir o rodapé
    <div className="min-h-dvh flex flex-col pb-16 lg:pb-0">
      <Header
        user={user}
        cartCount={cartCount}
        onSearch={(q) => navigate({ to: '/', search: { q: q || undefined, page: 1, sort: 'recent' } })}
        onLogout={() => logout.mutate()}
      />
      <RealtimeStatusBanner status={realtimeStatus} />
      {/* tabIndex -1: o skip link "Pular para o conteúdo" consegue mover o foco para cá */}
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav cartCount={cartCount} isAuthenticated={!!user} />
      {/* fora do bloco DEV: os toasts fazem parte da interface também no build de produção */}
      <Toaster theme="dark" position="bottom-center" richColors />
      {import.meta.env.DEV && (
        <>
          <TanStackRouterDevtools position="bottom-right" />
          <ReactQueryDevtools buttonPosition="bottom-left" />
        </>
      )}
    </div>
  )
}

function NotFound() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <Link to="/" className="underline mt-4 inline-block">
        Voltar ao início
      </Link>
    </div>
  )
}
