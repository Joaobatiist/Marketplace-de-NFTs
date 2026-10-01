import type { ReactNode } from 'react'
import type { Nft } from '@/contracts'
import { NftCard, NftCardSkeleton } from './nft-card'

/*
 * Mobile (Figma): 2 colunas com a coluna da direita deslocada para baixo.
 * O translate não mexe no fluxo, então a ordem de leitura/teclado continua linha a linha;
 * o pb-10 reserva o espaço que o último card deslocado ocupa.
 */
const gridClass = 'grid grid-cols-2 gap-x-3 gap-y-6 max-md:pb-10 sm:gap-x-5 md:grid-cols-3 md:gap-8'
const itemClass = 'min-w-0 max-md:even:translate-y-10'

interface NftGridProps {
  nfts: Nft[]
  /** controle extra por card (ex.: botão de favoritar), repassado como `action` do NftCard */
  renderCardAction?: (nft: Nft) => ReactNode
}

export function NftGrid({ nfts, renderCardAction }: NftGridProps) {
  return (
    <ul className={gridClass}>
      {nfts.map((nft) => (
        <li key={nft.id} className={itemClass}>
          <NftCard nft={nft} action={renderCardAction?.(nft)} />
        </li>
      ))}
    </ul>
  )
}

interface NftGridSkeletonProps {
  count: number
}

export function NftGridSkeleton({ count }: NftGridSkeletonProps) {
  return (
    <div role="status">
      <span className="sr-only">Carregando NFTs…</span>
      <ul aria-hidden="true" className={gridClass}>
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className={itemClass}>
            <NftCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  )
}
