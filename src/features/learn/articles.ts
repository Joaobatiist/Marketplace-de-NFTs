/*
 * Conteúdo editorial do "Diário da Cunhagem" (Figma, home): guias estáticos, versionados no código.
 * Não vêm da API porque não mudam com o estado do marketplace.
 */

export interface ArticleSection {
  heading: string
  paragraphs: string[]
  /** passos ou dicas em lista (ordenada quando `ordered`) */
  list?: { ordered?: boolean; items: string[] }
}

export interface Article {
  slug: string
  title: string
  excerpt: string
  /** AAAA-MM-DD */
  publishedAt: string
  readingMinutes: number
  image: string
  sections: ArticleSection[]
}

export const ARTICLES: Article[] = [
  {
    slug: 'como-funciona-a-propriedade-de-nfts',
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    publishedAt: '2026-09-12',
    readingMinutes: 6,
    image: '/images/nfts/3.webp',
    sections: [
      {
        heading: 'O que você compra',
        paragraphs: [
          'Um NFT é um registro único numa blockchain que aponta para uma obra digital e diz quem é o dono daquele token. Ao comprar, o token passa para a carteira que você escolheu no pagamento.',
          'O registro é público: qualquer pessoa pode conferir quem tem o token e todo o histórico de transferências, sem depender do marketplace.',
        ],
      },
      {
        heading: 'Token e arquivo não são a mesma coisa',
        paragraphs: [
          'A imagem, o áudio ou o modelo 3D normalmente ficam guardados fora da blockchain. O token guarda o endereço do arquivo e os metadados da obra.',
          'Por isso vale observar onde o arquivo está hospedado: armazenamentos descentralizados tendem a durar mais que um servidor comum.',
        ],
      },
      {
        heading: 'O que a compra não inclui',
        paragraphs: [
          'Ter o token não transfere automaticamente os direitos autorais. Em geral, o artista continua dono da obra e o colecionador pode exibi-la e revendê-la. Quando há licença comercial, ela vem descrita pelo criador.',
        ],
      },
    ],
  },
  {
    slug: 'como-comprar-seu-primeiro-nft',
    title: 'Como comprar seu primeiro NFT',
    excerpt: 'Do catálogo ao recibo: edições, carrinho, carteira, rede e confirmação.',
    publishedAt: '2026-09-13',
    readingMinutes: 4,
    image: '/images/nfts/1.webp',
    sections: [
      {
        heading: 'Passo a passo',
        paragraphs: ['Na Kurio, toda compra passa pelo carrinho e é confirmada pela rede antes do recibo.'],
        list: {
          ordered: true,
          items: [
            'Escolha o NFT e a edição (Standard ou Gold). Cada edição tem tiragem, estoque e limite por pedido.',
            'Adicione ao carrinho. O preço que você viu fica guardado: se ele mudar, o carrinho avisa antes do pagamento.',
            'Aplique um cupom, se tiver, e siga para o pagamento.',
            'Escolha a carteira cadastrada e a rede. A carteira precisa operar na rede escolhida.',
            'Revise os valores e confirme. O pedido fica pendente até a rede responder; depois disso, aparece o recibo.',
          ],
        },
      },
      {
        heading: 'Se algo mudar no caminho',
        paragraphs: [
          'Preço e estoque são atualizados em tempo real. Se um valor mudar durante a revisão, a confirmação fica bloqueada até você atualizar o carrinho: você nunca paga um valor que não viu.',
          'Se o pagamento for recusado, os itens continuam no carrinho para uma nova tentativa.',
        ],
      },
    ],
  },
  {
    slug: 'raridade-edicoes-e-procedencia',
    title: 'Raridade, edições e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    publishedAt: '2026-09-15',
    readingMinutes: 3,
    image: '/images/nfts/2.webp',
    sections: [
      {
        heading: 'Tiragem define a raridade',
        paragraphs: [
          'Uma edição com 5 unidades é mais escassa que uma com 50. Na Kurio, a edição Gold tem tiragem menor e preço maior que a Standard da mesma obra.',
          'O estoque mostrado em cada edição é o que ainda está à venda; "Esgotado" significa que toda a tiragem já tem dono.',
        ],
      },
      {
        heading: 'Procedência',
        paragraphs: [
          'Procedência é o histórico da obra: quem criou, quando foi cunhada e por quais carteiras passou. Prefira obras de criadores identificados e coleções com histórico verificável.',
        ],
      },
      {
        heading: 'Utilidade',
        paragraphs: [
          'Alguns NFTs dão acesso a algo além da obra: comunidades, ingressos, assinaturas. Confira na descrição o que está incluído e por quanto tempo.',
        ],
      },
    ],
  },
  {
    slug: 'como-proteger-sua-carteira',
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
    publishedAt: '2026-09-15',
    readingMinutes: 2,
    image: '/images/nfts/4.webp',
    sections: [
      {
        heading: 'Boas práticas',
        paragraphs: ['A carteira é a chave dos seus ativos. Quem tem a frase de recuperação tem tudo o que está nela.'],
        list: {
          items: [
            'Nunca compartilhe a frase de recuperação nem a chave privada. Nenhum suporte legítimo pede isso.',
            'Guarde a frase offline, em mais de um lugar seguro.',
            'Use uma carteira principal para guardar e uma secundária para o dia a dia: se a secundária for comprometida, o acervo principal fica a salvo.',
            'Confira o endereço do site e o que está assinando antes de aprovar qualquer transação.',
            'Revogue permissões de contratos que você não usa mais.',
          ],
        },
      },
    ],
  },
]

export const findArticle = (slug: string) => ARTICLES.find((a) => a.slug === slug)

/** "12 de setembro de 2026"; a data é só dia (sem fuso), então formata em UTC */
export const formatArticleDate = (date: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(date))
