import { createRootRouteWithContext, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from '@/lib/utils'
import { QueryClient } from "@tanstack/react-query";
import { useLogout, useSession } from "@/features/auth/queries";
import { useCartCount } from '@/features/cart/queries'
import { useRealtime } from '@/features/realtime/use-realtime'
import { RealtimeStatusBanner } from '@/features/realtime/components/realtime-status-banner'
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Toaster } from 'sonner'
import { lazy, Suspense } from 'react'

// painel de cenários: só no build com mocks (demonstração), em chunk separado
const ScenarioPanel =
  import.meta.env.VITE_ENABLE_MOCKS === 'true'
    ? lazy(() => import('@/dev/scenario-panel').then((m) => ({ default: m.ScenarioPanel })))
    : null

// devtools só em desenvolvimento: o import() some do build de produção
const Devtools = import.meta.env.DEV
  ? lazy(async () => {
      const [{ TanStackRouterDevtools }, { ReactQueryDevtools }] = await Promise.all([
        import('@tanstack/react-router-devtools'),
        import('@tanstack/react-query-devtools'),
      ])
      return {
        default: () => (
          <>
            <TanStackRouterDevtools position="bottom-right" />
            <ReactQueryDevtools buttonPosition="bottom-left" />
          </>
        ),
      }
    })
  : null

const AUTH_PATHS = new Set(['/login', '/register'])

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
  // Entrar/Criar conta no mobile são telas cheias (Figma): sem header, rodapé e barra inferior
  const isAuthPage = useRouterState({ select: (s) => AUTH_PATHS.has(s.location.pathname) })

  return (
    // pb-16: espaço para a barra inferior fixa do mobile não cobrir o rodapé
    <div className={cn('min-h-dvh flex flex-col lg:pb-0', !isAuthPage && 'pb-16')}>
      <Header
        className={isAuthPage ? 'max-lg:hidden' : undefined}
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
      <Footer className={isAuthPage ? 'max-lg:hidden' : undefined} />
      {!isAuthPage && <MobileBottomNav cartCount={cartCount} isAuthenticated={!!user} />}
      {/* depois do rodapé no DOM: o painel não entra no Tab antes do conteúdo principal */}
      {ScenarioPanel && (
        <Suspense fallback={null}>
          <ScenarioPanel />
        </Suspense>
      )}
      {/* fora do bloco DEV: os toasts fazem parte da interface também no build de produção */}
      <Toaster theme="dark" position="bottom-center" richColors />
      {Devtools && (
        <Suspense fallback={null}>
          <Devtools />
        </Suspense>
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
