import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** junta classes condicionais e resolve conflitos do Tailwind (a última vence: 'p-2' + 'p-4' → 'p-4') */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
