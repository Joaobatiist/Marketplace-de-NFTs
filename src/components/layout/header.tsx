import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, LogIn, LogOut, Menu, Search, ShoppingCart, User as UserIcon, Wallet, X } from 'lucide-react'
import type { User } from '@/contracts'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ComingSoon } from './coming-soon'

interface HeaderProps {
  user: User | null
  cartCount: number
  onSearch: (q: string) => void
  onLogout: () => void
}

/** itens do Figma sem página ainda: aparecem como texto "Em breve" */
const COMING_SOON_NAV = ['Mercado', 'Criadores', 'Aprenda']

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export function Header({ user, cartCount, onSearch, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <a
        href="#main"
        className="sr-only rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        Pular para o conteúdo
      </a>

      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 border-b px-4 lg:h-[4.5rem]">
        <Link to="/" className={cn('rounded-sm text-sm font-bold tracking-[0.2em]', focusRing)}>
          KURIO<span className="sr-only"> — página inicial</span>
        </Link>

        <nav aria-label="Principal" className="hidden flex-1 justify-center gap-8 self-stretch lg:flex">
          <Link
            to="/"
            activeOptions={{ exact: true, includeSearch: false }}
            className={cn(
              'relative flex items-center rounded-sm',
              // ativo: cor + sublinhado (não depende só da cor)
              'data-[status=active]:font-bold data-[status=active]:text-primary data-[status=active]:after:absolute data-[status=active]:after:inset-x-0 data-[status=active]:after:-bottom-px data-[status=active]:after:h-0.5 data-[status=active]:after:bg-primary',
              focusRing,
            )}
          >
            Início
          </Link>
          {COMING_SOON_NAV.map((label) => (
            <ComingSoon key={label} className="self-center">
              {label}
            </ComingSoon>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <div className="hidden items-center gap-2 lg:flex">
            <HeaderSearch onSearch={onSearch} />
            <CartLink cartCount={cartCount} />
            {user ? (
              <UserMenu user={user} onLogout={onLogout} />
            ) : (
              <>
                <Link to="/register" className={cn('rounded-md px-3 py-2 text-sm hover:text-primary', focusRing)}>
                  Criar conta
                </Link>
                <Link
                  to="/login"
                  className={cn(
                    'inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90',
                    focusRing,
                  )}
                >
                  <LogIn aria-hidden="true" className="size-4" />
                  Entrar
                </Link>
              </>
            )}
          </div>

          <MobileMenu user={user} cartCount={cartCount} onSearch={onSearch} onLogout={onLogout} />
        </div>
      </div>
    </header>
  )
}

function CartLink({ cartCount }: { cartCount: number }) {
  return (
    <Link
      to="/cart"
      aria-label={`Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
      className={cn('relative inline-flex size-10 items-center justify-center rounded-md hover:bg-card', focusRing)}
    >
      <ShoppingCart aria-hidden="true" className="size-5" />
      {cartCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] leading-4 font-bold text-primary-foreground"
        >
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </Link>
  )
}

/** lupa do Figma: abre um campo de busca no próprio header; Enter busca, Esc fecha */
function HeaderSearch({ onSearch }: { onSearch: (q: string) => void }) {
  const inputId = useId()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const toggleRef = useRef<HTMLButtonElement>(null)

  function close() {
    setOpen(false)
    setText('')
    toggleRef.current?.focus()
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSearch(text.trim())
    close()
  }

  return (
    <div className="flex items-center">
      {open && (
        <form role="search" onSubmit={handleSubmit} className="mr-1">
          <label htmlFor={inputId} className="sr-only">
            Buscar NFTs
          </label>
          <input
            id={inputId}
            type="search"
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && close()}
            placeholder="Buscar NFTs…"
            enterKeyHint="search"
            className="h-9 w-56 rounded-md border border-input bg-card px-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
          />
        </form>
      )}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-label={open ? 'Fechar busca' : 'Abrir busca'}
        className={cn('inline-flex size-10 items-center justify-center rounded-md hover:bg-card', focusRing)}
      >
        {open ? <X aria-hidden="true" className="size-5" /> : <Search aria-hidden="true" className="size-5" />}
      </button>
    </div>
  )
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function Avatar({ user, className }: { user: User; className?: string }) {
  return user.avatarUrl ? (
    <img src={user.avatarUrl} alt="" width={32} height={32} className={cn('size-8 rounded-full object-cover', className)} />
  ) : (
    <span aria-hidden="true" className={cn('flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground', className)}>
      {initials(user.name)}
    </span>
  )
}

function UserMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn('flex items-center gap-2 rounded-md py-1 pr-2 pl-1 text-sm hover:bg-card', focusRing)}>
        <Avatar user={user} />
        <span className="max-w-32 truncate">{user.name.split(' ')[0]}</span>
        <span className="sr-only">: menu da conta</span>
        <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate font-bold">{user.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <UserIcon aria-hidden="true" />
            Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/wallets">
            <Wallet aria-hidden="true" />
            Carteiras
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onLogout}>
          <LogOut aria-hidden="true" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/*
 * Menu mobile (< lg). Foco controlado pelo Radix Dialog: entra no Sheet ao abrir, fica preso nele
 * enquanto aberto e volta para o botão "Abrir menu" ao fechar (Esc, X, overlay ou ao escolher um item).
 */
function MobileMenu({ user, cartCount, onSearch, onLogout }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const inputId = useId()
  const [text, setText] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSearch(text.trim())
    setText('')
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
          <Menu aria-hidden="true" className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[85vw] max-w-sm gap-0 overflow-y-auto bg-card">
        <SheetHeader className="pr-12">
          <SheetTitle className="tracking-[0.2em]">KURIO</SheetTitle>
          <SheetDescription className="sr-only">Menu de navegação</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          <form role="search" onSubmit={handleSubmit}>
            <label htmlFor={inputId} className="sr-only">
              Buscar NFTs
            </label>
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id={inputId}
                type="search"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Buscar NFTs…"
                enterKeyHint="search"
                className="h-11 w-full rounded-md border border-input bg-background pr-3 pl-9 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
              />
            </div>
          </form>

          <nav aria-label="Principal (mobile)">
            <ul className="space-y-1">
              <MenuLink to="/" exact>
                Início
              </MenuLink>
              <MenuLink to="/cart">
                Carrinho{cartCount > 0 && <span className="ml-auto text-xs text-muted-foreground">{cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>}
              </MenuLink>
              {COMING_SOON_NAV.map((label) => (
                <li key={label} className="px-3 py-2.5 text-sm">
                  <ComingSoon>{label}</ComingSoon>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t pt-6">
            {user ? (
              <nav aria-label="Conta">
                <div className="mb-3 flex items-center gap-3 px-3">
                  <Avatar user={user} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <ul className="space-y-1">
                  <MenuLink to="/profile">Perfil</MenuLink>
                  <MenuLink to="/wallets">Carteiras</MenuLink>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        onLogout()
                      }}
                      className={cn('flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm text-destructive hover:bg-accent', focusRing)}
                    >
                      <LogOut aria-hidden="true" className="size-4" />
                      Sair
                    </button>
                  </li>
                </ul>
              </nav>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <SheetClose asChild>
                  <Link
                    to="/register"
                    className={cn('inline-flex h-10 items-center justify-center rounded-md border border-input text-sm hover:bg-accent', focusRing)}
                  >
                    Criar conta
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/login"
                    className={cn(
                      'inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/90',
                      focusRing,
                    )}
                  >
                    <LogIn aria-hidden="true" className="size-4" />
                    Entrar
                  </Link>
                </SheetClose>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MenuLink({ to, exact, children }: { to: '/' | '/cart' | '/profile' | '/wallets'; exact?: boolean; children: ReactNode }) {
  return (
    <li>
      <SheetClose asChild>
        <Link
          to={to}
          activeOptions={{ exact, includeSearch: false }}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-accent',
            // ativo: cor + barra lateral (não depende só da cor)
            'data-[status=active]:bg-accent data-[status=active]:font-bold data-[status=active]:text-primary data-[status=active]:shadow-[inset_3px_0_0_var(--color-primary)]',
            focusRing,
          )}
        >
          {children}
        </Link>
      </SheetClose>
    </li>
  )
}
