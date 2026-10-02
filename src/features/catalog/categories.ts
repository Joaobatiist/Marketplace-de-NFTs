import type { NftCategory } from '@/contracts'

/** rótulos em PT das categorias (filtro "Coleções" do Figma, Mercado) */
export const CATEGORY_LABELS: Record<NftCategory, string> = {
  digital_art: 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  art_3d: 'Arte 3D',
  collectibles: 'Colecionáveis',
  generative: 'Generativa',
  gaming: 'Jogos',
  memberships: 'Assinaturas',
  utility: 'Utilidade',
}
