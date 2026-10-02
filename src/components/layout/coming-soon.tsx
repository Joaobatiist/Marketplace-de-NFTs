import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ComingSoonProps {
  children: ReactNode
  className?: string
}

/**
 * Item de navegação fora do escopo atual: texto (não é link nem botão, não recebe foco)
 * com o selo "Em breve" visível. Nunca um link que leva a lugar nenhum.
 */
export function ComingSoon({ children, className }: ComingSoonProps) {
  return (
    <span aria-disabled="true" className={cn('inline-flex cursor-not-allowed items-center gap-2 text-muted-foreground/70', className)}>
      {children}
      <span className="rounded-sm border border-border px-1 py-0.5 text-[0.625rem] leading-none tracking-wide uppercase">
        Em breve
      </span>
    </span>
  )
}
