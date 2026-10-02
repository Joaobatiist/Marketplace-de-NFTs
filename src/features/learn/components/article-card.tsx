import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { formatArticleDate, type Article } from '../articles'

/** card do "Diário da Cunhagem" (Figma): o link fica no título e se estica sobre o card inteiro */
export function ArticleCard({ article, headingLevel = 'h2' }: { article: Article; headingLevel?: 'h2' | 'h3' }) {
  const Heading = headingLevel

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl bg-card',
        'has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2 has-[a:focus-visible]:ring-offset-background',
      )}
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={article.image}
          alt=""
          width={600}
          height={450}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <ArticleMeta article={article} />
        <Heading className="mt-2 font-bold">
          <Link
            to="/learn/$slug"
            params={{ slug: article.slug }}
            className="outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
          >
            {article.title}
          </Link>
        </Heading>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{article.excerpt}</p>
        <span aria-hidden="true" className="mt-auto pt-3 text-xs font-bold text-primary group-hover:underline">
          Ler mais →
        </span>
      </div>
    </article>
  )
}

export function ArticleMeta({ article, className }: { article: Article; className?: string }) {
  return (
    <p className={cn('text-[0.6875rem] text-muted-foreground', className)}>
      <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
      <span aria-hidden="true"> | </span>
      <span className="sr-only">, </span>
      Leitura de {article.readingMinutes} min
    </p>
  )
}
