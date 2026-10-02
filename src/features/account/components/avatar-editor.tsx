import { useId } from 'react'
import { ImageIcon } from 'lucide-react'

interface AvatarEditorProps {
  name: string
  avatarUrl: string | null
  error?: string
  isSaving: boolean
  onSelectFile: (file: File) => void
  onRemove: () => void
}

/**
 * "Avatar" do Figma: círculo (foto ou ícone), "Alterar" (input file com label visível em forma de
 * botão) e "Remover" em texto. A troca salva na hora, fora do "Salvar" do formulário.
 */
export function AvatarEditor({ name, avatarUrl, error, isSaving, onSelectFile, onRemove }: AvatarEditorProps) {
  const id = useId()

  return (
    <div className="space-y-3">
      <p id={`${id}-title`} className="text-[0.9375rem] leading-none">
        Avatar
      </p>
      <div role="group" aria-labelledby={`${id}-title`} className="flex flex-wrap items-center gap-6">
        {avatarUrl ? (
          <img src={avatarUrl} alt={`Foto de ${name}`} width={50} height={50} className="size-[3.125rem] rounded-full border border-border object-cover" />
        ) : (
          <span
            role="img"
            aria-label={`Sem foto: ${name}`}
            className="flex size-[3.125rem] items-center justify-center rounded-full border border-border bg-card text-primary"
          >
            <ImageIcon aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </span>
        )}

        <input
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
        {/* label visível em forma de botão: Enter/Espaço no input (foco no peer) abrem o seletor */}
        <label
          htmlFor={id}
          className="inline-flex h-10 cursor-pointer items-center rounded-[3px] bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {isSaving ? 'Salvando…' : 'Alterar'}
          <span className="sr-only"> foto</span>
        </label>
        <button
          type="button"
          onClick={onRemove}
          disabled={isSaving || !avatarUrl}
          className="cursor-pointer rounded-sm text-sm hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          Remover<span className="sr-only"> foto</span>
        </button>
      </div>
      <p id={`${id}-hint`} className="sr-only">
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
