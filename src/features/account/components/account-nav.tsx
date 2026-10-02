import { useEffect, useRef } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Download, Heart, LogOut, MapPin, ShoppingCart, SquareActivity, TriangleAlert, User, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccountNavProps {
  onLogout: () => void
}

type AccountPath = '/profile' | '/wallets' | '/activity' | '/watchlist' | '/offers' | '/downloads' | '/support'

/** itens da barra "Meu perfil", na ordem e com os ícones do Figma */
const LINKS: { to: AccountPath; label: string; icon: LucideIcon }[] = [
  { to: '/profile', label: 'Dados do perfil', icon: User },
  { to: '/wallets', label: 'Carteiras', icon: MapPin },
  { to: '/activity', label: 'Atividade', icon: ShoppingCart },
  { to: '/watchlist', label: 'Lista de interesse', icon: Heart },
  { to: '/offers', label: 'Ofertas', icon: SquareActivity },
  { to: '/downloads', label: 'Arquivos baixados', icon: Download },
  { to: '/support', label: 'Suporte', icon: TriangleAlert },
]

const itemClass = cn(
  'relative flex h-[2.8125rem] w-full cursor-pointer items-center gap-3.5 px-4 text-[0.9375rem] whitespace-nowrap text-primary outline-none',
  'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset lg:px-6',
)

/**
 * Barra lateral "Meu perfil" (Figma). Item atual: barra laranja à esquerda no desktop e embaixo no
 * mobile (forma, não só cor) + aria-current="page", que o Link do router marca sozinho.
 * No mobile vira uma faixa com rolagem horizontal acima do conteúdo.
 */
export function AccountNav({ onLogout }: AccountNavProps) {
  const navRef = useRef<HTMLElement>(null)
  const pathname = useLocation({ select: (l) => l.pathname })

  // mobile: a faixa rola até o item atual (no desktop a lista é vertical e nada muda)
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [pathname])

  return (
    <nav ref={navRef} aria-label="Minha conta" className="bg-card pt-5 lg:self-start lg:pt-6 lg:pb-5">
      <h2 className="px-4 text-lg font-bold lg:px-2.5">Meu perfil</h2>
      <ul className="mt-1 flex overflow-x-auto lg:flex-col lg:overflow-visible">
        {LINKS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="shrink-0">
            <Link
              to={to}
              className={cn(
                itemClass,
                'before:absolute before:hidden before:bg-primary data-[status=active]:before:block',
                'before:inset-x-3 before:bottom-0 before:h-1 lg:before:inset-x-auto lg:before:inset-y-0 lg:before:left-0 lg:before:h-auto lg:before:w-1.5',
              )}
            >
              <Icon aria-hidden="true" className="size-[1.125rem] shrink-0" strokeWidth={1.75} />
              {label}
            </Link>
          </li>
        ))}
        <li className="shrink-0 lg:mt-1 lg:border-t lg:border-border">
          <button type="button" onClick={onLogout} className={cn(itemClass, 'font-bold')}>
            <LogOut aria-hidden="true" className="size-[1.125rem] shrink-0" strokeWidth={1.75} />
            Sair
          </button>
        </li>
      </ul>
    </nav>
  )
}
