import { createFileRoute } from '@tanstack/react-router'
import { ARTICLES } from '@/features/learn/articles'
import { ArticleCard } from '@/features/learn/components/article-card'

export const Route = createFileRoute('/learn/')({ component: LearnPage })

function LearnPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Aprenda</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Diário da Cunhagem: histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ARTICLES.map((article) => (
          <li key={article.slug}>
            <ArticleCard article={article} />
          </li>
        ))}
      </ul>
    </div>
  )
}
