import { useState, type ImgHTMLAttributes } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NftImageProps {
  src: string | undefined
  alt: string
  className?: string
  /** a imagem provável de LCP passa 'eager' + fetchPriority 'high' */
  loading?: ImgHTMLAttributes<HTMLImageElement>['loading']
  fetchPriority?: ImgHTMLAttributes<HTMLImageElement>['fetchPriority']
}

/** imagem quadrada com fallback: se o arquivo falhar, mostra um placeholder no mesmo espaço */
export function NftImage({ src, alt, className, loading = 'lazy', fetchPriority }: NftImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!src || failedSrc === src) {
    return (
      <div
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        className="flex size-full items-center justify-center bg-muted text-muted-foreground"
      >
        <ImageOff aria-hidden="true" className="size-8" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      width={600}
      height={600}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      onError={() => setFailedSrc(src)}
      className={cn('size-full object-cover', className)}
    />
  )
}
