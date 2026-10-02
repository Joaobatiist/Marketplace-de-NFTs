import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { Nft } from '@/contracts'
import { formatEth, minEditionPrice } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { NftImage } from './nft-image'

interface FeaturedSectionProps {
  nfts: Nft[] | undefined
  isLoading: boolean
}

/*
 * Hero do Figma: texto fixo à esquerda + NFT em destaque à direita, com bolinhas para trocar de destaque.
 * O texto é copy da página (não depende da API), então aparece na hora; só imagem e botão têm skeleton,
 * nas mesmas dimensões do conteúdo real.
 */
export function FeaturedSection({ nfts, isLoading }: FeaturedSectionProps) {
  const [index, setIndex] = useState(0)
  const count = nfts?.length ?? 0
  const active = count > 0 ? index % count : 0 // protege contra a lista encolher num refetch
  const current = nfts?.[active]
  const next = count > 1 ? nfts?.[(active + 1) % count] : undefined
  const showMedia = isLoading || !!current

  return (
    <section
      aria-labelledby="featured-title"
      aria-roledescription="carrossel"
      className="relative overflow-hidden rounded-3xl bg-card p-5 md:rounded-none md:bg-transparent md:p-0"
    >
      {/* círculo decorativo do card mobile */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-20 -left-16 size-72 rounded-full bg-secondary md:hidden" />

      <div className={cn('relative grid items-center gap-4 md:gap-12', showMedia ? 'grid-cols-[1fr_auto] md:grid-cols-2' : 'grid-cols-1')}>
        <div className="min-w-0 md:px-10">
          <p className="text-xs md:text-sm">Bem-vindo à Kurio</p>
          <h1
            id="featured-title"
            className="mt-2 text-lg leading-snug font-bold tracking-wide uppercase md:mt-4 md:text-4xl md:leading-[1.6] lg:text-[2.6rem]"
          >
            Seja dono do futuro da arte digital
          </h1>
          {/* o Figma usa um texto curto no mobile; display:none tira a versão escondida do leitor de tela */}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground md:mt-4 md:max-w-xl md:text-sm">
            <span className="md:hidden">Descubra NFTs selecionados de criadores do mundo todo.</span>
            <span className="max-md:hidden">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie
              artistas e tenha uma parte da cultura da internet.
            </span>
          </p>

          <div className="mt-3 md:mt-8">
            {current ? (
              <Link
                to="/nfts/$nftId"
                params={{ nftId: current.id }}
                className={cn(
                  'inline-flex h-6 items-center gap-2 rounded-md text-sm font-bold text-primary uppercase outline-none',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'md:h-10 md:bg-primary md:px-7 md:text-primary-foreground md:hover:bg-primary/90',
                )}
              >
                Explorar<span className="sr-only"> {current.name}</span>
                <ArrowRight aria-hidden="true" className="size-4 md:hidden" />
              </Link>
            ) : (
              isLoading && <Skeleton className="h-6 w-28 md:h-10 md:w-36" />
            )}
          </div>

          {/* altura fixa de 12 px: os botões de 24 px transbordam sem empurrar o layout */}
          {(isLoading || count > 1) && (
            <div className="mt-4 flex h-3 items-center justify-center md:mt-10 md:justify-end md:pr-4">
              {nfts && count > 1
                ? nfts.map((nft, i) => (
                    <button
                      key={nft.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Mostrar destaque ${i + 1} de ${count}: ${nft.name}`}
                      aria-current={i === active ? 'true' : undefined}
                      // alvo de toque real de 24×24 (WCAG 2.5.8); o ponto visual de 8 px fica dentro
                      className="group flex h-6 min-w-6 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'h-2 rounded-full transition-all motion-reduce:transition-none',
                          // ativo = mais largo (não depende só da cor)
                          i === active ? 'w-6 bg-primary' : 'w-2 bg-primary/40 group-hover:bg-primary/70',
                        )}
                      />
                    </button>
                  ))
                : isLoading && <Skeleton className="h-2 w-14 rounded-full" />}
            </div>
          )}
        </div>

        {showMedia && (
          <div className="relative size-32 sm:size-40 md:aspect-square md:size-auto md:w-full md:max-w-[450px] md:justify-self-end">
            {current ? (
              <>
                {/* fora do tab: o "Explorar" já leva ao mesmo destino */}
                <Link
                  to="/nfts/$nftId"
                  params={{ nftId: current.id }}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="block size-full overflow-hidden rounded-2xl md:rounded-3xl"
                >
                  <NftImage
                    key={current.id}
                    src={current.images[0]}
                    alt={`Arte do NFT ${current.name}`}
                    loading="eager"
                    fetchPriority={active === 0 ? 'high' : 'auto'}
                  />
                </Link>

                {next && (
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-2 -left-3 size-14 overflow-hidden rounded-xl border-2 border-card sm:size-16 md:hidden"
                  >
                    <NftImage src={next.images[0]} alt="" />
                  </div>
                )}

                <p
                  aria-live="polite"
                  className="max-md:sr-only md:absolute md:right-4 md:bottom-4 md:left-4 md:truncate md:rounded-lg md:bg-background/80 md:px-3 md:py-2 md:text-sm md:backdrop-blur"
                >
                  <span className="sr-only">
                    Destaque {active + 1} de {count}:{' '}
                  </span>
                  {current.name} · <span className="font-bold text-primary">{formatEth(minEditionPrice(current))}</span>
                </p>
              </>
            ) : (
              <Skeleton className="size-full rounded-2xl md:rounded-3xl" />
            )}
          </div>
        )}
      </div>
    </section>
  )
}
