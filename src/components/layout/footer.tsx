import { useId, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import type { NftCategory } from '@/contracts'
import { cn } from '@/lib/utils'
import { ComingSoon } from './coming-soon'

const FEATURES = [
  { letter: 'W', title: 'Segurança da carteira', text: 'Proteja sua carteira e colecione arte digital verificada com confiança.' },
  { letter: 'C', title: 'Criadores em destaque', text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.' },
  { letter: 'D', title: 'Alertas de lançamentos', text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.' },
]

/** coluna "Coleções" do Figma: filtra o catálogo de verdade */
const FOOTER_CATEGORIES: { category: NftCategory; label: string }[] = [
  { category: 'digital_art', label: 'Arte digital' },
  { category: 'photography', label: 'Fotografia' },
  { category: 'music', label: 'Música' },
  { category: 'art_3d', label: 'Arte 3D' },
  { category: 'utility', label: 'Utilidade' },
]

const PROFILE_LINKS = [
  { to: '/profile', label: 'Meu perfil' },
  { to: '/wallets', label: 'Carteiras' },
  { to: '/activity', label: 'Atividade' },
  { to: '/watchlist', label: 'Lista de interesse' },
] as const
const PROFILE_SOON = ['Minha coleção', 'Estúdio do criador']
/** itens da central de ajuda que já têm guia na seção Aprenda */
const HELP_ARTICLES = [
  { slug: 'como-comprar-seu-primeiro-nft', label: 'Como comprar NFTs' },
  { slug: 'como-proteger-sua-carteira', label: 'Carteira e segurança' },
]
const HELP_SOON = ['Central de ajuda', 'Política do mercado', 'Denunciar item']

const linkClass =
  'rounded-sm hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card'

export function Footer({ className }: { className?: string }) {
  const emailId = useId()

  return (
    <footer className={cn('mx-auto mt-16 w-full max-w-7xl px-4 pb-6', className)}>
      <div className="overflow-hidden rounded-t-xl bg-card">
        {/* destaques + newsletter */}
        <div className="grid gap-8 p-6 sm:grid-cols-2 md:p-10 lg:grid-cols-4 lg:gap-0">
          {FEATURES.map((f) => (
            <div key={f.title} className="lg:border-r lg:border-primary/40 lg:px-8 lg:first:pl-0">
              <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {f.letter}
              </span>
              <h2 className="mt-4 font-bold">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}

          <div className="lg:pl-8">
            <h2 className="font-bold">Antecipe-se ao próximo lançamento</h2>
            {/* newsletter ainda sem backend: campos desabilitados com aviso, para não parecer que funciona */}
            <form className="mt-3" aria-describedby={`${emailId}-soon`} onSubmit={(e) => e.preventDefault()}>
              {/* rótulo sem "e-mail": não colide com o campo E-mail dos formulários de login/cadastro */}
              <label htmlFor={emailId} className="sr-only">
                Endereço para receber a newsletter
              </label>
              <div className="flex">
                <input
                  id={emailId}
                  type="email"
                  disabled
                  placeholder="digite seu e-mail…"
                  className="h-10 min-w-0 flex-1 rounded-l-md border border-r-0 border-input bg-background px-3 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled
                  className="h-10 rounded-r-md bg-primary px-4 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Enviar
                </button>
              </div>
            </form>
            <p id={`${emailId}-soon`} className="mt-2 text-xs text-muted-foreground">
              <ComingSoon>Newsletter</ComingSoon>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
            </p>
          </div>
        </div>

        {/* faixa de contato (texto do Figma; não são links) */}
        <div className="grid gap-3 bg-secondary px-6 py-6 text-sm sm:grid-cols-2 md:px-10 lg:grid-cols-4 lg:items-center">
          <p className="font-bold tracking-[0.2em]">KURIO</p>
          <p className="text-muted-foreground">Feito para colecionadores, criadores e cultura</p>
          <p className="text-muted-foreground">contato@email.com</p>
          <p className="text-muted-foreground">+55 11 4002 8922</p>
        </div>

        {/* colunas de links */}
        <nav aria-label="Rodapé" className="grid gap-8 p-6 text-sm sm:grid-cols-2 md:p-10 lg:grid-cols-4">
          <FooterColumn title="Meu perfil">
            {PROFILE_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className={linkClass}>
                  {label}
                </Link>
              </li>
            ))}
            {PROFILE_SOON.map((label) => (
              <li key={label}>
                <ComingSoon>{label}</ComingSoon>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Central de ajuda">
            {HELP_ARTICLES.map(({ slug, label }) => (
              <li key={slug}>
                <Link to="/learn/$slug" params={{ slug }} className={linkClass}>
                  {label}
                </Link>
              </li>
            ))}
            {HELP_SOON.map((label) => (
              <li key={label}>
                <ComingSoon>{label}</ComingSoon>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Coleções">
            {FOOTER_CATEGORIES.map(({ category, label }) => (
              <li key={category}>
                <Link to="/" search={{ category, page: 1, sort: 'recent' }} className={linkClass}>
                  {label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <div className="space-y-8">
            <div>
              <h2 className="mb-3 font-bold">Redes sociais</h2>
              <ComingSoon>Perfis oficiais</ComingSoon>
            </div>
            <div>
              <h2 className="mb-3 font-bold">Carteiras compatíveis</h2>
              <p className="inline-block rounded-md border border-primary/40 bg-secondary px-3 py-1.5 text-[0.625rem] font-bold tracking-wide text-primary uppercase">
                MetaMask · WalletConnect · Coinbase
              </p>
            </div>
          </div>
        </nav>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}

function FooterColumn({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn(className)}>
      <h2 className="mb-3 font-bold">{title}</h2>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  )
}
