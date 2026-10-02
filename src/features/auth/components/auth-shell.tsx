import { useId, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SocialButtons } from './social-buttons'

interface AuthShellProps {
  mode: 'login' | 'register'
  /** título da tela (visível no mobile; no desktop as abas fazem esse papel e ele fica para o leitor de tela) */
  title: string
  /** texto de apoio sob as abas (só desktop, como no Figma) */
  description: string
  redirect?: string
  /** "Novo na Kurio? Crie uma conta" / "Já tem uma conta? Entre" (só mobile) */
  switchPrompt: ReactNode
  children: ReactNode
}

const tabClass = cn(
  'rounded-sm text-xl tracking-wide outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring',
  'data-[status=active]:text-primary',
)

/**
 * Moldura de Entrar/Criar conta (Figma).
 * Desktop: card de 500 px no formato do modal do print (abas, fechar, faixa laranja embaixo).
 * Mobile: tela própria com o logo grande (o layout raiz esconde header e barra inferior nestas rotas).
 */
export function AuthShell({ mode, title, description, redirect, switchPrompt, children }: AuthShellProps) {
  const titleId = useId()

  return (
    <div className="mx-auto flex w-full max-w-[25.875rem] flex-col px-7 pt-24 pb-10 lg:my-20 lg:max-w-[31.25rem] lg:px-0 lg:pt-0 lg:pb-0">
      <Link
        to="/"
        className="mx-auto rounded-sm text-[2rem] font-bold tracking-[0.12em] outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
      >
        KURIO<span className="sr-only"> — página inicial</span>
      </Link>

      <section
        aria-labelledby={titleId}
        className="relative mt-20 lg:mt-0 lg:border-b-[10px] lg:border-primary lg:bg-card lg:px-20 lg:pt-12 lg:pb-24"
      >
        <Link
          to="/"
          aria-label="Fechar"
          className="absolute top-3 right-4 hidden size-8 items-center justify-center rounded-sm text-primary outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring lg:flex"
        >
          <X aria-hidden="true" className="size-5" />
        </Link>

        <nav aria-label="Entrar ou criar conta" className="hidden items-center justify-center gap-2 lg:flex">
          <Link to="/login" search={{ redirect }} className={tabClass}>
            Entrar
          </Link>
          <span aria-hidden="true" className="h-6 w-px bg-primary" />
          <Link to="/register" search={{ redirect }} className={tabClass}>
            Criar conta
          </Link>
        </nav>

        <h1 id={titleId} className="text-center text-lg font-bold lg:sr-only">
          {title}
        </h1>
        <p className="mx-auto mt-10 hidden max-w-[25rem] text-center text-[0.8125rem] leading-snug lg:block">{description}</p>

        <div className={cn('mt-10', mode === 'login' ? 'lg:mt-6' : 'lg:mt-5')}>{children}</div>

        <div className="mt-11 lg:mt-7">
          <SocialButtons />
        </div>

        <p className="mt-12 text-center text-[0.9375rem] text-muted-foreground lg:hidden">{switchPrompt}</p>
      </section>
    </div>
  )
}
