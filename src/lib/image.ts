const MAX_BYTES = 2 * 1024 * 1024
const SIZE = 256

/** valida, recorta em quadrado e reduz para 256×256 WebP (data URL) */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Selecione um arquivo de imagem.')
  if (file.size > MAX_BYTES) throw new Error('A imagem deve ter no máximo 2 MB.')

  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  canvas
    .getContext('2d')!
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
  return canvas.toDataURL('image/webp', 0.85)
}
