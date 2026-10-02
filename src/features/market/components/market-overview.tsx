import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { CATEGORY_LABELS } from '@/features/catalog/categories'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { CategoryStats, CollectionStats, GroupStats, marketSummary } from '../stats'

const cardClass = cn(
  'group relative rounded-xl bg-card p-5 transition-colors hover:bg-accent',
  'has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2 has-[a:focus-visible]:ring-offset-background',
)
/** o link fica no título e se estica sobre o card inteiro (mesmo padrão do NftCard) */
const stretchedLink = "outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"

const floorText = (floor: string | null) => (floor ? formatEth(floor) : 'Esgotado')

export function MarketStats({ summary }: { summary: ReturnType<typeof marketSummary> }) {
  const tiles: { label: string; value: string }[] = [
    { label: 'NFTs listados', value: String(summary.items) },
    { label: 'Coleções', value: String(summary.collections) },
    { label: 'Unidades à venda', value: String(summary.available) },
    { label: 'Preço mínimo', value: floorText(summary.floor) },
  ]
  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-xl bg-card p-4 md:p-5">
          <dt className="text-xs text-muted-foreground">{t.label}</dt>
          <dd className="mt-1 text-xl font-bold text-primary md:text-2xl">{t.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function GroupNumbers({ stats }: { stats: GroupStats }) {
  return (
    <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
      <div>
        <dt className="text-muted-foreground">Itens</dt>
        <dd className="mt-0.5 text-sm font-bold">{stats.items}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">À venda</dt>
        <dd className="mt-0.5 text-sm font-bold">{stats.available}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">A partir de</dt>
        <dd className={cn('mt-0.5 text-sm font-bold', stats.floor ? 'text-primary' : 'text-muted-foreground')}>
          {floorText(stats.floor)}
        </dd>
      </div>
    </dl>
  )
}

function GroupCard({ title, link, stats }: { title: string; link: ReactNode; stats: GroupStats }) {
  return (
    <article aria-label={title} className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold">{link}</h3>
        <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
      </div>
      <GroupNumbers stats={stats} />
    </article>
  )
}

export function CollectionList({ collections }: { collections: CollectionStats[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((c) => (
        <li key={c.name}>
          <GroupCard
            title={c.name}
            stats={c}
            link={
              <Link to="/" search={{ q: c.name, page: 1, sort: 'recent' }} className={stretchedLink}>
                {c.name}
                <span className="sr-only">, ver no catálogo</span>
              </Link>
            }
          />
        </li>
      ))}
    </ul>
  )
}

export function CategoryList({ categories }: { categories: CategoryStats[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c) => (
        <li key={c.category}>
          <GroupCard
            title={CATEGORY_LABELS[c.category]}
            stats={c}
            link={
              <Link to="/" search={{ category: c.category, page: 1, sort: 'recent' }} className={stretchedLink}>
                {CATEGORY_LABELS[c.category]}
                <span className="sr-only">, ver no catálogo</span>
              </Link>
            }
          />
        </li>
      ))}
    </ul>
  )
}

/** mesmas dimensões das seções reais: sem salto de layout quando os dados chegam */
export function MarketSkeleton() {
  return (
    <div role="status" className="space-y-10">
      <span className="sr-only">Carregando mercado…</span>
      <div aria-hidden="true" className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[4.75rem] rounded-xl md:h-[5.75rem]" />
        ))}
      </div>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-[8.5rem] rounded-xl" />
        ))}
      </div>
    </div>
  )
}
