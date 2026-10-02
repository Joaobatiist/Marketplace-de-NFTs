import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { catalogSearchSchema, PAGE_SIZE, toListParams, type CatalogSearch } from '@/features/catalog/search'
import { featuredQueryOptions, nftListQueryOptions } from '@/features/catalog/queries'
import { toApiError } from '@/lib/http'
import { FeaturedSection } from '@/features/catalog/components/featured-section'
import { SearchBar } from '@/features/catalog/components/search-bar'
import { SortSelect } from '@/features/catalog/components/sort-select'
import { FilterPanel } from '@/features/catalog/components/filter-panel'
import { NftGrid, NftGridSkeleton } from '@/features/catalog/components/nft-grid'
import { Pagination } from '@/features/catalog/components/pagination'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  loaderDeps: ({ search }) => search,
  // prefetch sem await: a página abre na hora mostrando skeletons
  loader: ({ context: { queryClient }, deps }) => {
    void queryClient.prefetchQuery(nftListQueryOptions(toListParams(deps)))
    void queryClient.prefetchQuery(featuredQueryOptions)
  },
  component: HomePage,
})

function HomePage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const list = useQuery(nftListQueryOptions(toListParams(search)))
  const featured = useQuery(featuredQueryOptions)

  // qualquer mudança de filtro volta para a página 1
  const updateFilters = (patch: Partial<CatalogSearch>, replace = false) =>
    navigate({ search: (prev) => ({ ...prev, ...patch, page: 1 }), replace })

  const clearFilters = () => navigate({ search: { sort: search.sort, page: 1 } })

  const goToPage = (page: number) => navigate({ search: (prev) => ({ ...prev, page }) })

  function renderResults() {
    if (list.isPending) return <NftGridSkeleton count={PAGE_SIZE} />

    if (!list.data) {
      return <ErrorState message={toApiError(list.error).message} onRetry={() => void list.refetch()} />
    }

    if (list.data.items.length === 0) {
      return (
        <EmptyState
          title="Nenhum NFT encontrado"
          description="Tente ajustar a busca ou os filtros."
          actionLabel="Limpar filtros"
          onAction={clearFilters}
        />
      )
    }

    return (
      <div aria-busy={list.isPlaceholderData} className={list.isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
        <NftGrid nfts={list.data.items} />
        <Pagination page={list.data.page} totalPages={list.data.totalPages} onPageChange={goToPage} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      <FeaturedSection nfts={featured.data} isLoading={featured.isPending} />

     <section aria-labelledby="catalog-title" className="space-y-6">
  <h2 id="catalog-title" className="text-2xl font-bold">Catálogo</h2>

  <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-8">
    <aside aria-label="Filtros" className="lg:sticky lg:top-24">
      <FilterPanel
        value={{
          category: search.category,
          minPrice: search.minPrice,
          maxPrice: search.maxPrice,
          onlyAvailable: search.onlyAvailable,
        }}
        onChange={(patch) => updateFilters(patch)}
        onClear={clearFilters}
      />
    </aside>

    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchBar value={search.q ?? ''} onSearch={(q) => updateFilters({ q: q || undefined }, true)} />
        <SortSelect value={search.sort} onChange={(sort) => updateFilters({ sort })} />
      </div>

      {list.isError && list.data && (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível atualizar. Mostrando os últimos resultados carregados.
        </p>
      )}

      <p aria-live="polite" className="sr-only">
        {list.data ? `${list.data.total} resultados encontrados` : ''}
      </p>

      {renderResults()}
    </div>
  </div>
</section>
    </div>
  )
}