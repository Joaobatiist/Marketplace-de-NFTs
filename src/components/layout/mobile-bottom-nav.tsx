import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { House, LogIn, ShoppingCart, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  cartCount: number
  isAuthenticated: boolean
}

/*
 * Barra inferior do Figma mobile (< lg). Favoritos e o botão central (escanear) ficaram de fora:
 * não têm página ainda, e um ícone sem rótulo não tem onde mostrar "Em breve".
 */
export function MobileBottomNav({ cartCount, isAuthenticated }: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-3">
        <NavItem to="/" exact label="Início" icon={<House aria-hidden="true" className="size-5" />} />
        <NavItem
          to="/cart"
          label="Carrinho"
          srLabel={`Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
          icon={
            <span className="relative">
              <ShoppingCart aria-hidden="true" className="size-5" />
              {cartCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 -right-2.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] leading-4 font-bold text-primary-foreground"
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </span>
          }
        />
        {isAuthenticated ? (
          <NavItem to="/profile" label="Perfil" icon={<User aria-hidden="true" className="size-5" />} />
        ) : (
          <NavItem to="/login" label="Entrar" icon={<LogIn aria-hidden="true" className="size-5" />} />
        )}
      </ul>
    </nav>
  )
}

interface NavItemProps {
  to: '/' | '/cart' | '/profile' | '/login'
  label: string
  /** rótulo completo para leitor de tela quando o visível não basta (ex.: quantidade no carrinho) */
  srLabel?: string
  icon: ReactNode
  exact?: boolean
}

function NavItem({ to, label, srLabel, icon, exact }: NavItemProps) {
  return (
    <li>
      <Link
        to={to}
        activeOptions={{ exact, includeSearch: false }}
        aria-label={srLabel}
        className={cn(
          'relative flex h-full flex-col items-center justify-center gap-1 text-[0.6875rem] text-muted-foreground',
          'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
          // ativo: cor + negrito + traço no topo (não depende só da cor)
          'data-[status=active]:font-bold data-[status=active]:text-primary',
          'data-[status=active]:before:absolute data-[status=active]:before:top-0 data-[status=active]:before:h-0.5 data-[status=active]:before:w-8 data-[status=active]:before:rounded-full data-[status=active]:before:bg-primary',
        )}
      >
        {icon}
        {label}
      </Link>
    </li>
  )
}
