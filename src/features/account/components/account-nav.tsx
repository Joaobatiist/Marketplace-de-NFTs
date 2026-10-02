import { Link } from '@tanstack/react-router'
import { Download, Heart, LifeBuoy, LogOut, ShoppingCart, Tag, User, Wallet, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ComingSoon } from '@/components/layout/coming-soon'

interface AccountNavProps {
  current: 'profile' | 'wallets'
  onLogout: () => void
}

const LINKS: { id: AccountNavProps['current']; to: '/profile' | '/wallets'; label: string; icon: LucideIcon }[] = [
  { id: 'profile', to: '/profile', label: 'Dados do perfil', icon: User },
  { id: 'wallets', to: '/wallets', label: 'Carteiras', icon: Wallet },
]

/** itens do Figma sem tela ainda: texto "Em breve" (não são links) */
const SOON: { label: string; icon: LucideIcon }[] = [
  { label: 'Atividade', icon: ShoppingCart },
  { label: 'Lista de interesse', icon: Heart },
  { label: 'Ofertas', icon: Tag },
  { label: 'Arquivos baixados', icon: Download },
  { label: 'Suporte', icon: LifeBuoy },
]

/** barra lateral "Meu perfil" (Figma: Perfil do colecionador e Carteiras) */
export function AccountNav({ current, onLogout }: AccountNavProps) {
  return (
    <nav aria-label="Minha conta" className="rounded-xl bg-card py-3 lg:self-start">
      <h2 className="px-4 pb-2 text-lg font-bold">Meu perfil</h2>
      <ul className="flex gap-1 overflow-x-auto px-2 lg:flex-col lg:px-0">
        {LINKS.map(({ id, to, label, icon: Icon }) => (
          <li key={id} className="shrink-0">
            <Link
              to={to}
              aria-current={current === id ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring lg:rounded-none lg:px-4',
                // atual: cor + barra lateral + negrito (não depende só da cor)
                current === id ? 'bg-accent font-bold text-primary lg:shadow-[inset_4px_0_0_var(--color-primary)]' : 'text-primary/90 hover:bg-accent',
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </Link>
          </li>
        ))}
        {SOON.map(({ label, icon: Icon }) => (
          <li key={label} className="hidden px-4 py-2.5 text-sm lg:block">
            <ComingSoon>
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </ComingSoon>
          </li>
        ))}
        <li className="shrink-0 lg:mt-1 lg:border-t lg:pt-1">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold text-primary outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring lg:rounded-none lg:px-4"
          >
            <LogOut aria-hidden="true" className="size-4" />
            Sair
          </button>
        </li>
      </ul>
    </nav>
  )
}
