import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** bloco de carregamento com brilho deslizante; fica estático com prefers-reduced-motion */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative overflow-hidden rounded-md bg-muted',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer',
        'before:bg-linear-to-r before:from-transparent before:via-foreground/8 before:to-transparent',
        'motion-reduce:before:hidden',
        className,
      )}
      {...props}
    />
  )
}
