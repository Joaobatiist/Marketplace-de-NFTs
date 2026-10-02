import { cn } from '@/lib/utils'

/** botão principal de Entrar/Criar conta: grande e arredondado no mobile, compacto no card do desktop (Figma) */
export const authSubmitClass = cn(
  'flex h-[3.75rem] w-full cursor-pointer items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground lg:h-11 lg:rounded-[3px] lg:text-[0.9375rem]',
  'hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
  'disabled:cursor-not-allowed disabled:opacity-60',
)

export const authLinkClass =
  'cursor-pointer rounded-sm text-primary/90 underline-offset-2 hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
