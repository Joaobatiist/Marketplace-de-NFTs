import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-destructive/60 px-6 py-12 text-center">
      <TriangleAlert aria-hidden="true" className="size-10 text-destructive" />
      <p className="font-bold">Algo deu errado</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-2">
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
