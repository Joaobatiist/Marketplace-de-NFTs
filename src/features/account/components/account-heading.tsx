import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AccountHeadingProps {
  title: string
  description?: ReactNode
  /** ação à direita do título (Figma: "Adicionar") */
  action?: ReactNode
  as?: 'h1' | 'h2'
  id?: string
  className?: string
}

/** título das telas "Meu perfil" (Figma): negrito pequeno, descrição dourada e ação à direita */
export function AccountHeading({ title, description, action, as: Heading = 'h1', id, className }: AccountHeadingProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-x-6 gap-y-3', className)}>
      <div className="min-w-0">
        <Heading id={id} className="text-[1.0625rem] font-bold">
          {title}
        </Heading>
        {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}

export const textActionClass =
  'cursor-pointer rounded-sm text-base font-bold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline'
