import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import { Download } from 'lucide-react'
import { NftImage } from '@/features/catalog/components/nft-image'
import { formatDateTime } from '@/features/checkout/format'
import { Skeleton } from '@/components/ui/skeleton'

export interface DownloadItem {
  key: string
  nftId: string
  /** "NFT · Edição" (snapshot do pedido) */
  name: string
  quantity: number
  orderId: string
  purchasedAt: string
  fileUrl: string | undefined
}

/** nome de arquivo legível: "cosmic-tiger-1-standard.webp" */
function fileName(item: DownloadItem) {
  const ext = item.fileUrl?.split('.').pop() ?? 'webp'
  const slug = item.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug}.${ext}`
}

/** obra comprada: miniatura, nome, pedido e "Baixar" (arquivo da obra) */
export function DownloadRow({ item }: { item: DownloadItem }) {
  const titleId = useId()

  return (
    <article aria-labelledby={titleId} className="flex flex-wrap items-center gap-4 rounded-[3px] border border-border p-4">
      <Link
        to="/nfts/$nftId"
        params={{ nftId: item.nftId }}
        tabIndex={-1}
        aria-hidden="true"
        className="size-16 shrink-0 overflow-hidden rounded-[3px] bg-muted"
      >
        <NftImage src={item.fileUrl} alt="" />
      </Link>
      <div className="min-w-0 flex-1 space-y-1">
        <h2 id={titleId} className="truncate font-bold">
          <Link to="/nfts/$nftId" params={{ nftId: item.nftId }} className="rounded-sm hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            {item.name}
          </Link>
        </h2>
        <p className="text-xs text-muted-foreground">
          {item.quantity} {item.quantity === 1 ? 'unidade' : 'unidades'} · pedido {item.orderId} ·{' '}
          <time dateTime={item.purchasedAt}>{formatDateTime(item.purchasedAt)}</time>
        </p>
      </div>
      {item.fileUrl ? (
        <a
          href={item.fileUrl}
          download={fileName(item)}
          aria-describedby={titleId}
          className="inline-flex h-10 items-center gap-2 rounded-[3px] border border-primary px-4 text-sm font-bold text-primary hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          <Download aria-hidden="true" className="size-4" />
          Baixar
        </a>
      ) : (
        <span className="text-sm text-muted-foreground">Arquivo indisponível</span>
      )}
    </article>
  )
}

export function DownloadRowSkeleton() {
  return <Skeleton className="h-[5.375rem] rounded-[3px]" />
}
