import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useLogout } from '@/features/auth/queries'
import { AccountNav } from '@/features/account/components/account-nav'

/** layout comum das telas da conta (Figma "Meu perfil"): barra lateral de 310 px + conteúdo */
export const Route = createFileRoute('/_auth/_account')({ component: AccountLayout })

function AccountLayout() {
  const logout = useLogout()

  return (
    // minmax(0,1fr) no mobile: a faixa de navegação rola dentro dela em vez de alargar a página
    <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-7 px-4 pt-8 pb-12 lg:grid-cols-[19.375rem_minmax(0,1fr)]">
      <AccountNav onLogout={() => logout.mutate()} />
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
