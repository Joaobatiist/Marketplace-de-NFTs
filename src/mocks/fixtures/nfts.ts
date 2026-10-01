import { NFT_CATEGORIES, type Nft } from '@/contracts/nft'

const COLLECTIONS = ['Neon Apes', 'Pixel Jungle', 'Cyber Koi', 'Void Masks', 'Lunar Relics'] as const
const ADJECTIVES = ['Cosmic', 'Silent', 'Golden', 'Wild', 'Electric', 'Ancient'] as const
const NOUNS = ['Tiger', 'Mask', 'Orbit', 'Bloom', 'Glitch'] as const
const IMAGE_COUNT = 4
const CREATOR_COUNT = 4

// valores determinísticos: sem Math.random, para testes e screenshots estáveis
function milliPrice(i: number) {
  return 50 + ((i * 137) % 2950) // 0.050 a 2.999 ETH
}

export const seedNfts: Nft[] = Array.from({ length: 30 }, (_, idx) => {
  const i = idx + 1
  const id = `nft_${String(i).padStart(3, '0')}`
  const soldOut = i % 7 === 0
  const creator = (idx % CREATOR_COUNT) + 1

  return {
    id,
    name: `${ADJECTIVES[idx % ADJECTIVES.length]} ${NOUNS[idx % NOUNS.length]} #${i}`,
    description: `Peça única da coleção ${COLLECTIONS[idx % COLLECTIONS.length]}.`,
    collection: COLLECTIONS[idx % COLLECTIONS.length],
    // passo 4 é coprimo de 9: percorre todas as categorias (3 ou 4 NFTs cada) sem seguir a ordem das coleções
    category: NFT_CATEGORIES[(idx * 4) % NFT_CATEGORIES.length],
    creator: { name: `Artista ${creator}`, avatarUrl: `/images/creators/${creator}.webp` },
    images: [0, 1, 2].map((o) => `/images/nfts/${((idx + o) % IMAGE_COUNT) + 1}.webp`),
    editions: [
      {
        id: `${id}_std`,
        name: 'Standard',
        price: (milliPrice(i) / 1000).toFixed(3),
        supply: 50,
        available: soldOut ? 0 : 50 - ((i * 3) % 45),
        maxPerOrder: 5,
      },
      {
        id: `${id}_gold`,
        name: 'Gold',
        price: ((milliPrice(i) * 4) / 1000).toFixed(3),
        supply: 5,
        available: soldOut || i % 3 === 0 ? 0 : (i % 5) + 1,
        maxPerOrder: 2,
      },
    ],
    featured: i <= 4,
    createdAt: new Date(Date.UTC(2026, 0, i)).toISOString(),
    version: 1,
  }
})