import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import type { Nft } from '@/contracts'
import { formatEth, isSoldOut, minEditionPrice } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { NftImage } from './nft-image'

interface NftCardProps {
  nft: Nft
  /** controle sobre a imagem (ex.: favoritar), no canto superior direito como no Figma */
  action?: ReactNode
  /** card acima da dobra: imagem sem lazy-load (no mobile, a do 1º card é o LCP da home) */
  priority?: boolean
}

/*
 * Estrutura: o link fica só no nome (h3) e se estica por cima do card inteiro (after:inset-0).
 * Assim o card todo é clicável, o leitor de tela anuncia só o nome, e o `action` pode ser um
 * <button> sem ficar dentro do <a> (HTML inválido): ele fica num bloco posicionado com z-10,
 * acima da camada do link.
 */
export function NftCard({ nft, action, priority = false }: NftCardProps) {
  const soldOut = isSoldOut(nft)

  return (
    <article
      className={cn(
        'group relative rounded-xl outline-none',
        'has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-4 has-[a:focus-visible]:ring-offset-background',
      )}
    >
      <div className="rounded-xl bg-card p-2 sm:p-3">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <NftImage
            src={nft.images[0]}
            alt={`Arte do NFT ${nft.name}`}
            loading={priority ? 'eager' : 'lazy'}
            className={cn(
              'transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100',
              soldOut && 'opacity-50 grayscale',
            )}
          />
          {soldOut && (
            <span className="absolute top-3 left-0 rounded-r-md bg-primary px-2.5 py-1 text-xs font-bold tracking-wide text-primary-foreground uppercase">
              Esgotado
            </span>
          )}
        </div>
      </div>

      {action && <div className="absolute top-4 right-4 z-10 sm:top-5 sm:right-5">{action}</div>}

      <div className="mt-3 space-y-1 px-1">
        <h3 className="truncate text-sm sm:text-base">
          <Link
            to="/nfts/$nftId"
            params={{ nftId: nft.id }}
            className="outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
          >
            {nft.name}
          </Link>
        </h3>
        <p className="truncate text-xs text-muted-foreground">
          {nft.collection} · <span className="sr-only">criado por </span>
          {nft.creator.name}
        </p>
        <p className={cn('font-bold text-primary sm:text-lg', soldOut && 'text-muted-foreground line-through')}>
          <span className="sr-only">{soldOut ? 'Esgotado. Preço era a partir de ' : 'A partir de '}</span>
          {formatEth(minEditionPrice(nft))}
        </p>
      </div>
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="rounded-xl bg-card p-2 sm:p-3">
        <Skeleton className="aspect-square rounded-xl" />
      </div>
      {/* alturas iguais às linhas de texto do card real: sem salto de layout quando os dados chegam */}
      <div className="mt-3 space-y-1 px-1">
        <div className="flex h-5 items-center sm:h-6">
          <Skeleton className="h-3.5 w-3/4" />
        </div>
        <div className="flex h-4 items-center">
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="flex h-6 items-center sm:h-7">
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    </div>
  )
}
