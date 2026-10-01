import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nfts/$nftId')({
  component: NftDetailPage,
})

// componente nomeado: hooks (Route.useParams) só podem rodar em componentes com nome em PascalCase
function NftDetailPage() {
  const { nftId } = Route.useParams()
  return <p className="p-8">NFT {nftId}</p>
}
