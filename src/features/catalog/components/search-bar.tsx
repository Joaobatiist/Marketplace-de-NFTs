import { useEffect, useEffectEvent, useId, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEBOUNCE_MS = 300

interface SearchBarProps {
  value: string
  onSearch: (q: string) => void
}

export function SearchBar({ value, onSearch }: SearchBarProps) {
  const inputId = useId()
  const [text, setText] = useState(value)
  const [prevValue, setPrevValue] = useState(value)

  // value mudou por fora (voltar/avançar no histórico, "limpar filtros"): alinha o input.
  // Ajuste durante o render, como a doc do React recomenda, em vez de um efeito que pisca o valor antigo.
  // Se o novo value é só o texto atual sem espaços nas pontas, mantém o que a pessoa digitou.
  if (value !== prevValue) {
    setPrevValue(value)
    if (value !== text.trim()) setText(value)
  }

  // useEffectEvent: lê sempre o onSearch mais recente sem reiniciar o debounce quando o pai re-renderiza
  const emitSearch = useEffectEvent((q: string) => onSearch(q))

  useEffect(() => {
    const q = text.trim()
    if (q === value) return
    const timer = setTimeout(() => emitSearch(q), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [text, value])

  return (
    <form
      role="search"
      className="w-full md:max-w-md"
      onSubmit={(e) => {
        e.preventDefault()
        // Enter busca na hora; o efeito acima não dispara de novo porque value vai casar com o texto
        if (text.trim() !== value) onSearch(text.trim())
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Buscar NFTs por nome, coleção ou criador
      </label>
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          id={inputId}
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Explorar coleções"
          autoComplete="off"
          enterKeyHint="search"
          className={cn(
            'h-12 w-full rounded-xl border border-transparent bg-card pr-4 pl-12 text-sm text-foreground',
            'placeholder:text-muted-foreground',
            'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none',
          )}
        />
      </div>
    </form>
  )
}
