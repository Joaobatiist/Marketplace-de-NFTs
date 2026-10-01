import { useId } from 'react'
import { NFT_SORTS, type NftSort } from '@/contracts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const SORT_LABELS: Record<NftSort, string> = {
  recent: 'Mais recentes',
  price_asc: 'Menor preço',
  price_desc: 'Maior preço',
  name: 'Nome',
}

const isNftSort = (v: string): v is NftSort => (NFT_SORTS as readonly string[]).includes(v)

interface SortSelectProps {
  value: NftSort
  onChange: (sort: NftSort) => void
}

export function SortSelect({ value, onChange }: SortSelectProps) {
  const labelId = useId()

  return (
    <div className="flex items-center gap-2 self-end md:self-auto">
      <span id={labelId} className="text-sm whitespace-nowrap text-muted-foreground">
        Ordenar por:
      </span>
      <Select value={value} onValueChange={(v) => isNftSort(v) && onChange(v)}>
        <SelectTrigger
          aria-labelledby={labelId}
          className="h-10 min-w-40 border-transparent bg-transparent text-foreground shadow-none hover:bg-card dark:bg-transparent dark:hover:bg-card"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          {NFT_SORTS.map((sort) => (
            <SelectItem key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
