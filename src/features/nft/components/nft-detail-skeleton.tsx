import { Skeleton } from '@/components/ui/skeleton'

/*
 * Mesmo grid da página real (rota /nfts/$nftId) e mesmas caixas dos componentes:
 * cada "linha" de texto é um bloco com a altura de linha do texto real e o shimmer dentro,
 * para não haver salto de layout quando os dados chegam.
 */
export function NftDetailSkeleton() {
  return (
    <div role="status" className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-2">
      <span className="sr-only">Carregando NFT…</span>

      {/* NftGallery */}
      <div aria-hidden="true" className="flex min-w-0 flex-col gap-3 lg:flex-row-reverse lg:items-start lg:gap-6">
        <div className="min-w-0 flex-1 rounded-2xl bg-card p-3 sm:p-5">
          <Skeleton className="aspect-square rounded-2xl" />
        </div>
        <div className="flex gap-3 p-1 lg:w-24 lg:shrink-0 lg:flex-col lg:p-0">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="size-16 shrink-0 rounded-lg sm:size-20 lg:size-24" />
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="space-y-6">
        {/* NftInfo + FavoriteButton */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-4">
            <TextLine className="h-[1.875rem] w-2/3 md:h-[2.25rem]" bar="h-6 md:h-7" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <TextLine className="h-5 w-40" bar="h-3.5" />
            </div>
            <TextLine className="h-5 w-48" bar="h-3.5" />
            <div className="space-y-2">
              <TextLine className="h-5 w-32" bar="h-3.5" />
              {/* 1 linha, como as descrições atuais; texto mais longo empurra só o que vem abaixo dele */}
              <TextLine className="h-[1.42rem] w-3/4" bar="h-3.5" />
            </div>
          </div>
          <Skeleton className="size-10 shrink-0 rounded-full" />
        </div>

        {/* PurchasePanel */}
        <div className="space-y-6 border-t pt-6">
          <div className="flex items-baseline justify-between gap-4">
            <TextLine className="h-9 w-36" bar="h-7" />
            <TextLine className="h-5 w-28" bar="h-3.5" />
          </div>
          <div>
            <TextLine className="mb-3 h-5 w-16" bar="h-3.5" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-[2.125rem] w-36 rounded-full" />
              <Skeleton className="h-[2.125rem] w-28 rounded-full" />
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <TextLine className="h-5 w-8" bar="h-3.5" />
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-10 w-14" />
                <Skeleton className="size-10 rounded-full" />
              </div>
              <div className="h-4" />
            </div>
            <Skeleton className="h-11 min-w-52 flex-1 sm:flex-none" />
          </div>
        </div>
      </div>
    </div>
  )
}

/** caixa com a altura de uma linha de texto real e a barra de shimmer centralizada nela */
function TextLine({ className, bar }: { className: string; bar: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <Skeleton className={`w-full ${bar}`} />
    </div>
  )
}
