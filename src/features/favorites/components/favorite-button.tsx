import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  isFavorite: boolean
  onToggle: () => void
  /** nome do item, usado no rótulo acessível ("Favoritar {label}") */
  label: string
}

/** coração do Figma: contorno quando não favoritado, preenchido quando favoritado (forma + cor) */
export function FavoriteButton({ isFavorite, onToggle, label }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      // rótulo fixo: o estado vem só do aria-pressed ("Favoritar X, pressionado"), como no padrão de toggle do ARIA
      aria-pressed={isFavorite}
      aria-label={`Favoritar ${label}`}
      className={cn(
        'inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-primary/60 bg-background/75 text-primary backdrop-blur transition-colors',
        'hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
        isFavorite && 'border-primary bg-primary/15',
      )}
    >
      <Heart aria-hidden="true" className={cn('size-5 transition-transform motion-reduce:transition-none', isFavorite && 'scale-110 fill-current')} />
    </button>
  )
}
