import { useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import type { SupportForm as SupportFormValues, SupportTicket } from '@/contracts'
import { ordersQueryOptions, useSendSupport } from '@/features/account/queries'
import { AccountHeading } from '@/features/account/components/account-heading'
import { SupportForm } from '@/features/account/components/support-form'
import { SUPPORT_TOPIC_LABELS } from '@/features/account/format'
import { toApiError } from '@/lib/http'

export const Route = createFileRoute('/_auth/_account/support')({ component: SupportPage })

const linkClass = 'rounded-sm text-primary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

const FAQ = [
  {
    question: 'Meu pedido está "Processando". O que fazer?',
    answer: (
      <>
        Nada: o pagamento é confirmado pela rede em alguns segundos e a tela atualiza sozinha. Acompanhe em{' '}
        <Link to="/activity" className={linkClass}>
          Atividade
        </Link>
        . Se recarregar a página, o mesmo pedido é recuperado — você não paga duas vezes.
      </>
    ),
  },
  {
    question: 'O pagamento foi recusado. Perdi meus itens?',
    answer: 'Não. Os itens continuam no carrinho e o estoque reservado é devolvido. Confira a carteira e a rede e tente de novo.',
  },
  {
    question: 'Por que o preço mudou no carrinho?',
    answer:
      'Preço e estoque mudam em tempo real. Quando isso acontece, o pagamento fica bloqueado até você confirmar os valores novos em "Atualizar carrinho".',
  },
  {
    question: 'Como protejo minha carteira?',
    answer: (
      <>
        Nunca compartilhe a frase de recuperação. Veja o guia{' '}
        <Link to="/learn/$slug" params={{ slug: 'como-proteger-sua-carteira' }} className={linkClass}>
          Como proteger sua carteira
        </Link>
        .
      </>
    ),
  },
]

function SupportPage() {
  const { session } = Route.useRouteContext()
  const orders = useQuery(ordersQueryOptions(session.user.id))
  const send = useSendSupport()
  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const confirmationRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (values: SupportFormValues) => {
    try {
      const created = await send.mutateAsync(values)
      setTicket(created)
      // leva o foco à confirmação: quem usa teclado ou leitor de tela ouve o protocolo
      requestAnimationFrame(() => confirmationRef.current?.focus())
      return null
    } catch (error) {
      return toApiError(error)
    }
  }

  return (
    <div className="space-y-12">
      <AccountHeading title="Suporte" description="Dúvidas comuns e um canal direto com a equipe da Kurio." />

      <section aria-labelledby="faq-title" className="space-y-4">
        <h2 id="faq-title" className="text-base font-bold">Perguntas frequentes</h2>
        <div className="divide-y divide-border border-y border-border">
          {FAQ.map(({ question, answer }) => (
            <details key={question} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
                {question}
                <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-primary transition-transform group-open:rotate-180 motion-reduce:transition-none" />
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="contact-title" className="space-y-6">
        <div>
          <h2 id="contact-title" className="text-base font-bold">Fale com a gente</h2>
          <p className="mt-1 text-sm text-muted-foreground">Respondemos pelo e-mail {session.user.email} em até 1 dia útil.</p>
        </div>

        {ticket && (
          <div
            ref={confirmationRef}
            tabIndex={-1}
            role="status"
            className="rounded-[3px] border border-primary bg-primary/10 p-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="font-bold">Recebemos sua mensagem.</p>
            <p className="mt-1">
              Protocolo <strong>{ticket.protocol}</strong> · {SUPPORT_TOPIC_LABELS[ticket.topic]}
            </p>
          </div>
        )}

        <SupportForm orders={orders.data ?? []} onSubmit={handleSubmit} />
      </section>
    </div>
  )
}
