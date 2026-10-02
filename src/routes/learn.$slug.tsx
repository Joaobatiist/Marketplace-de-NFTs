import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { ARTICLES, findArticle } from '@/features/learn/articles'
import { ArticleCard, ArticleMeta } from '@/features/learn/components/article-card'
import { EmptyState } from '@/components/feedback/empty-state'

export const Route = createFileRoute('/learn/$slug')({ component: ArticlePage })

const backLinkClass =
  'inline-flex items-center gap-2 rounded-sm text-sm text-muted-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

function ArticlePage() {
  const { slug } = Route.useParams()
  const navigate = Route.useNavigate()
  const article = findArticle(slug)

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Artigo não encontrado"
          description="O endereço pode estar errado ou o artigo saiu do ar."
          actionLabel="Ver todos os artigos"
          onAction={() => void navigate({ to: '/learn' })}
        />
      </div>
    )
  }

  const more = ARTICLES.filter((a) => a.slug !== slug).slice(0, 3)

  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-8">
      <article className="mx-auto max-w-3xl">
        <Link to="/learn" className={backLinkClass}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Aprenda
        </Link>

        {/* imagem quadrada ao lado (e não banner): os assets têm 238–434 px e ficariam borrados esticados */}
        <header className="mt-6 flex flex-col-reverse gap-6 md:grid md:grid-cols-[minmax(0,1fr)_12rem] md:items-center">
          <div>
            <ArticleMeta article={article} className="text-xs" />
            <h1 className="mt-2 text-2xl leading-tight font-bold md:text-4xl">{article.title}</h1>
            <p className="mt-3 text-muted-foreground">{article.excerpt}</p>
          </div>
          <div className="aspect-square w-32 overflow-hidden rounded-xl bg-muted md:w-full">
            <img src={article.image} alt="" width={192} height={192} fetchPriority="high" className="size-full object-cover" />
          </div>
        </header>

        <div className="mt-8 space-y-8 text-sm leading-relaxed md:text-base">
          {article.sections.map((section) => {
            const List = section.list?.ordered ? 'ol' : 'ul'
            return (
              <section key={section.heading} className="space-y-3">
                <h2 className="text-lg font-bold md:text-xl">{section.heading}</h2>
                {section.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {section.list && (
                  <List className={section.list.ordered ? 'list-decimal space-y-2 pl-6' : 'list-disc space-y-2 pl-6'}>
                    {section.list.items.map((item) => (
                      <li key={item} className="marker:text-primary">{item}</li>
                    ))}
                  </List>
                )}
              </section>
            )
          })}
        </div>

        <Link
          to="/"
          className="mt-10 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          Explorar o catálogo
        </Link>
      </article>

      <section aria-labelledby="more-articles" className="space-y-6">
        <h2 id="more-articles" className="text-xl font-bold">Continue aprendendo</h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {more.map((a) => (
            <li key={a.slug}>
              <ArticleCard article={a} headingLevel="h3" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
