import { useFavorite } from '../queries'
import { FavoriteButton } from './favorite-button'

export function FavoriteToggle({ nftId, nftName }: { nftId: string; nftName: string }) {
  const { isFavorite, toggle } = useFavorite(nftId)
  return <FavoriteButton isFavorite={isFavorite} onToggle={toggle} label={nftName} />
}