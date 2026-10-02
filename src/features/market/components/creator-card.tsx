import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { NftImage } from '@/features/catalog/components/nft-image'
import { formatEth } from '@/lib/eth'
import { Skeleton } from '@/components/ui/skeleton'
import type { CreatorStats } from '../stats'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export function CreatorCard({ creator }: { creator: CreatorStats }) {
  const titleId = useId()

  return (
    <article aria-labelledby={titleId} className="flex h-full flex-col rounded-xl bg-card p-5">
      <div className="flex items-center gap-4">
        <img
          src={creator.avatarUrl}
          alt=""
          width={64}
          height={64}
          loading="lazy"
          decoding="async"
          className="size-16 shrink-0 rounded-full bg-muted object-cover"
        />
        <div className="min-w-0">
          <h2 id={titleId} className="truncate text-lg font-bold">{creator.name}</h2>
          <p className="text-xs text-muted-foreground">
            {plural(creator.items, 'obra', 'obras')} · {plural(creator.collections.length, 'coleção', 'coleções')}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">A partir de</dt>
          <dd className="mt-0.5 text-sm font-bold text-primary">{creator.floor ? formatEth(creator.floor) : 'Esgotado'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Unidades à venda</dt>
          <dd className="mt-0.5 text-sm font-bold">{creator.available}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">Coleções</dt>
          <dd className="mt-0.5">{creator.collections.join(', ')}</dd>
        </div>
      </dl>

      <h3 className="sr-only">Obras recentes de {creator.name}</h3>
      <ul className="mt-4 grid grid-cols-3 gap-2">
        {creator.works.map((nft) => (
          <li key={nft.id}>
            <Link
              to="/nfts/$nftId"
              params={{ nftId: nft.id }}
              className="block aspect-square overflow-hidden rounded-lg bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <NftImage src={nft.images[0]} alt={nft.name} className="transition-transform duration-300 hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100" />
            </Link>
          </li>
        ))}
      </ul>

      <Link
        to="/"
        search={{ q: creator.name, page: 1, sort: 'recent' }}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 self-start rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none sm:mt-auto sm:self-stretch"
      >
        Ver obras<span className="sr-only"> de {creator.name}</span>
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </article>
  )
}

export function CreatorCardSkeleton() {
  return <Skeleton className="h-[22rem] rounded-xl" />
}
