import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

/** 1 … 4 5 [6] 7 8 … 20 — sempre mostra a primeira, a última e 1 vizinha de cada lado da atual */
function pageItems(page: number, totalPages: number): (number | 'gap')[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  return sorted.flatMap((p, i) => {
    const gap = p - (sorted[i - 1] ?? p)
    if (gap === 2) return [p - 1, p] // buraco de 1 página: mostra o número em vez de "…"
    return gap > 2 ? ['gap' as const, p] : [p]
  })
}

const itemClass = cn(
  'inline-flex size-9 items-center justify-center rounded-md border text-sm transition-colors',
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
)

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginação" className="mt-10">
      <ul className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
        <li>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
            className={cn(itemClass, 'hover:bg-card disabled:pointer-events-none disabled:opacity-40')}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
        </li>

        {pageItems(page, totalPages).map((item, i) =>
          item === 'gap' ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted-foreground">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPageChange(item)}
                aria-label={`Página ${item}`}
                aria-current={item === page ? 'page' : undefined}
                className={cn(
                  itemClass,
                  // atual: preenchida + negrito (não depende só da cor)
                  item === page ? 'border-primary bg-primary font-bold text-primary-foreground' : 'hover:bg-card',
                )}
              >
                {item}
              </button>
            </li>
          ),
        )}

        <li>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Próxima página"
            className={cn(itemClass, 'hover:bg-card disabled:pointer-events-none disabled:opacity-40')}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </li>
      </ul>
    </nav>
  )
}
