import { cn } from '@/lib/utils'

/** campo das telas "Meu perfil" (Figma): cantos quase retos, borda marrom, fundo da página */
export const controlClass = cn(
  'h-10 w-full rounded-[3px] border border-border bg-background px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground',
  'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none',
  'aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50',
)

/** botão principal das telas "Meu perfil" (Figma: "Salvar", "Salvar carteira") */
export const submitButtonClass = cn(
  'inline-flex h-10 cursor-pointer items-center justify-center rounded-[3px] bg-primary px-10 text-sm font-bold text-primary-foreground',
  'hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
  'disabled:cursor-not-allowed disabled:opacity-60',
)
