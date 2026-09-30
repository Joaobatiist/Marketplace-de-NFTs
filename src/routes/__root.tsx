import { createRootRouteWithContext, Outlet, Link } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient } from "@tanstack/react-query";

interface RootRouteContext {
    queryClient: QueryClient;   
}

export const Route = createRootRouteWithContext<RootRouteContext>()({
    component: RootLayout,
    notFoundComponent: NotFound,
});

function RootLayout() {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header entra aqui depois */}
      <main className="flex-1">
        <Outlet />
      </main>
      {/* Footer entra aqui depois */}
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