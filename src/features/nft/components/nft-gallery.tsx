import { useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { NftImage } from '@/features/catalog/components/nft-image'

interface NftGalleryProps {
  images: string[]
  name: string
}

/*
 * Figma desktop: miniaturas em coluna à esquerda + imagem principal num quadro.
 * Mobile: imagem principal em cima e miniaturas em linha embaixo.
 *
 * Teclado (padrão "toolbar" do ARIA): Tab entra na miniatura ativa; setas, Home e End trocam
 * de imagem e movem o foco junto; só a ativa fica no Tab (tabindex móvel).
 */
export function NftGallery({ images, name }: NftGalleryProps) {
  const [index, setIndex] = useState(0)
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([])
  const total = images.length
  const active = total > 0 ? Math.min(index, total - 1) : 0 // protege contra a lista encolher num refetch

  function select(next: number, moveFocus = false) {
    const wrapped = (next + total) % total
    setIndex(wrapped)
    if (moveFocus) thumbRefs.current[wrapped]?.focus()
  }

  function handleKeyDown(e: KeyboardEvent) {
    const keys: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowDown: active + 1,
      ArrowLeft: active - 1,
      ArrowUp: active - 1,
      Home: 0,
      End: total - 1,
    }
    if (!(e.key in keys)) return
    e.preventDefault()
    select(keys[e.key], true)
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 lg:flex-row-reverse lg:items-start lg:gap-6">
      <div className="min-w-0 flex-1 rounded-2xl bg-card p-3 sm:p-5">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
          <NftImage
            key={images[active]}
            src={images[active]}
            alt={total > 1 ? `${name}, imagem ${active + 1} de ${total}` : name}
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </div>

      {total > 1 && (
        <div
          role="toolbar"
          aria-label={`Imagens de ${name}`}
          // sem aria-orientation: a lista é horizontal no mobile e vertical no desktop, e as 4 setas funcionam
          onKeyDown={handleKeyDown}
          className="flex gap-3 overflow-x-auto p-1 lg:w-24 lg:shrink-0 lg:flex-col lg:overflow-visible lg:p-0"
        >
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              ref={(el) => {
                thumbRefs.current[i] = el
              }}
              type="button"
              onClick={() => select(i)}
              tabIndex={i === active ? 0 : -1}
              aria-label={`Ver imagem ${i + 1} de ${total}`}
              aria-current={i === active ? 'true' : undefined}
              className={cn(
                'relative size-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 sm:size-20 lg:size-24',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
                // ativa: borda laranja + sem esmaecer (não depende só da cor)
                i === active ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              <NftImage src={src} alt="" />
            </button>
          ))}
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {total > 1 ? `Imagem ${active + 1} de ${total}` : ''}
      </p>
    </div>
  )
}
