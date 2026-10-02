import { toast } from 'sonner'

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0">
      <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.5 5.5 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.65Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.29 14.3A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.3V6.6H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l4.01-3.1Z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.6l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75Z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0">
      <path fill="#3b5ec2" d="M13.5 22v-8.2h2.77l.41-3.2H13.5V8.56c0-.93.26-1.56 1.59-1.56h1.7V4.14A22.6 22.6 0 0 0 14.3 4c-2.45 0-4.13 1.5-4.13 4.25v2.36H7.4v3.2h2.77V22h3.33Z" />
    </svg>
  )
}

const PROVIDERS = [
  { name: 'Google', icon: GoogleIcon },
  { name: 'Facebook', icon: FacebookIcon },
] as const

/**
 * "Ou continue com" + Google/Facebook (Figma). Estáticos: OAuth não faz parte do escopo, então
 * os botões ficam com aria-disabled (anunciados como indisponíveis) e o clique só avisa.
 */
export function SocialButtons() {
  return (
    <div className="space-y-4">
      <div className="relative flex items-center justify-center lg:-mx-20">
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-border" />
        <span className="relative bg-background px-3 text-[0.8125rem] lg:bg-card">Ou continue com</span>
      </div>
      <ul className="space-y-4 lg:space-y-3">
        {PROVIDERS.map(({ name, icon: Icon }) => (
          <li key={name}>
            <button
              type="button"
              aria-disabled="true"
              aria-describedby="social-soon"
              onClick={() => toast.info(`Entrar com ${name} ainda não está disponível.`)}
              className="flex h-10 w-full cursor-pointer items-center justify-center gap-3 rounded-[3px] border border-border text-[0.8125rem] text-foreground/85 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Icon />
              Continuar com {name}
            </button>
          </li>
        ))}
      </ul>
      <p id="social-soon" className="sr-only">
        Em breve: por enquanto, entre com e-mail e senha.
      </p>
    </div>
  )
}
