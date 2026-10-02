import { useId, useRef } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AvatarEditorProps {
  name: string
  avatarUrl: string | null
  error?: string
  isSaving: boolean
  onSelectFile: (file: File) => void
  onRemove: () => void
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** preview circular (iniciais sem foto), "Alterar foto" (input file com label visível) e "Remover foto" */
export function AvatarEditor({ name, avatarUrl, error, isSaving, onSelectFile, onRemove }: AvatarEditorProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt={`Foto de ${name}`} width={80} height={80} className="size-20 rounded-full border-2 border-primary/50 object-cover" />
        ) : (
          <span role="img" aria-label={`Sem foto: iniciais de ${name}`} className="flex size-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {initials(name)}
          </span>
        )}

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/*"
            disabled={isSaving}
            aria-describedby={error ? `${id}-error` : `${id}-hint`}
            className="peer sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              // limpa o valor: escolher o mesmo arquivo de novo dispara o change outra vez
              e.target.value = ''
              if (file) onSelectFile(file)
            }}
          />
          {/* label visível estilizado como botão: Enter/Espaço no input (foco no peer) abrem o seletor */}
          <label
            htmlFor={id}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          >
            <Camera aria-hidden="true" className="size-4" />
            {isSaving ? 'Salvando…' : 'Alterar foto'}
          </label>
          <Button variant="outline" onClick={onRemove} disabled={isSaving || !avatarUrl}>
            <Trash2 aria-hidden="true" className="size-4" />
            Remover foto
          </Button>
        </div>
      </div>
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        JPG, PNG ou WebP de até 2 MB. A imagem é recortada em quadrado.
      </p>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
