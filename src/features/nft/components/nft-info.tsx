import { useState } from 'react'
import type { Nft } from '@/contracts'

interface NftInfoProps {
  nft: Nft
}

export function NftInfo({ nft }: NftInfoProps) {
  return (
    <div className="min-w-0 space-y-4">
      <h1 className="text-2xl leading-tight font-bold break-words md:text-3xl">{nft.name}</h1>

      <div className="flex items-center gap-3">
        <CreatorAvatar name={nft.creator.name} src={nft.creator.avatarUrl} />
        <p className="text-sm">
          <span className="text-muted-foreground">Criado por </span>
          <span className="font-bold">{nft.creator.name}</span>
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Coleção: <span className="text-foreground">{nft.collection}</span>
      </p>

      <div className="space-y-2">
        <h2 className="text-sm font-bold">Sobre este NFT:</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{nft.description}</p>
      </div>
    </div>
  )
}

/** avatar redondo; se a imagem falhar, mostra as iniciais no mesmo tamanho */
function CreatorAvatar({ name, src }: { name: string; src: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  // alt vazio: o nome do criador já está escrito ao lado
  if (!src || failedSrc === src) {
    return (
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {initials}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt=""
      width={36}
      height={36}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(src)}
      className="size-9 shrink-0 rounded-full border border-primary/40 object-cover"
    />
  )
}
