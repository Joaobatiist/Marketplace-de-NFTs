import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 'details' | 'review'

const STEPS: { id: Step; label: string }[] = [
  { id: 'details', label: 'Dados e carteira' },
  { id: 'review', label: 'Revisão' },
]

interface CheckoutStepsProps {
  current: Step
}

export function CheckoutSteps({ current }: CheckoutStepsProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === current)

  return (
    <nav aria-label="Etapas do pagamento">
      <ol className="flex items-center gap-3">
        {STEPS.map((step, i) => {
          const isCurrent = i === currentIndex
          const isDone = i < currentIndex
          return (
            <li key={step.id} aria-current={isCurrent ? 'step' : undefined} className="flex min-w-0 items-center gap-3">
              {i > 0 && <span aria-hidden="true" className={cn('h-px w-6 shrink-0 sm:w-12', isDone || isCurrent ? 'bg-primary' : 'bg-border')} />}
              {/* atual: círculo preenchido + negrito; concluída: check; próxima: contorno (não depende só da cor) */}
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold',
                  isCurrent && 'border-primary bg-primary text-primary-foreground',
                  isDone && 'border-primary text-primary',
                  !isCurrent && !isDone && 'border-border text-muted-foreground',
                )}
              >
                {isDone ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn('truncate text-sm', isCurrent ? 'font-bold' : 'text-muted-foreground')}>
                {step.label}
                {isDone && <span className="sr-only"> (concluída)</span>}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
