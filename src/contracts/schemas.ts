import { z } from 'zod'
import { NETWORKS, WALLET_PROVIDERS } from './wallet'
import { SUPPORT_TOPICS } from './account'

const email = z.string().trim().min(1, 'Informe o e-mail').email('E-mail inválido')
const password = z.string().min(8, 'A senha deve ter pelo menos 8 caracteres')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha'),
})

export const registerRequestSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome'),
  email,
  password,
})

export const registerFormSchema = registerRequestSchema
  .extend({ confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export const buyerSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome'),
  email,
})

export const checkoutFormSchema = buyerSchema.extend({
  walletId: z.string().min(1, 'Selecione uma carteira'),
  network: z.enum(NETWORKS, { message: 'Selecione a rede' }),
})

export type CheckoutForm = z.infer<typeof checkoutFormSchema>

export const ENS_SUFFIXES = ['.eth', '.base.eth'] as const

const username = z
  .string()
  .trim()
  .regex(/^[a-z0-9._]{3,20}$/, 'Use de 3 a 20 caracteres: letras minúsculas, números, ponto ou _')
const ensLabel = z.string().trim().regex(/^[a-z0-9-]{3,}$/, 'Use 3 ou mais caracteres: letras minúsculas, números ou hífen')
const walletNickname = z.string().trim().min(2, 'Informe o apelido da carteira').max(40, 'Máximo de 40 caracteres')

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome'),
  email,
  username,
  ensName: z.string().trim().regex(/^[a-z0-9-]{3,}\.(eth|base\.eth)$/, 'Nome ENS inválido'),
  walletNickname,
  avatarUrl: z
    .string()
    .startsWith('data:image/', 'Imagem inválida')
    .max(400_000, 'Imagem muito grande')
    .nullable()
    .optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: password,
})

export const changePasswordFormSchema = changePasswordSchema
  .extend({ confirmPassword: z.string() })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

/*
 * Formulário único da tela "Perfil do colecionador" (Figma): dados + troca de senha opcional
 * com um só "Salvar". A senha só é validada se algum dos três campos foi preenchido.
 */
export const profileFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome'),
    username,
    email,
    ensLabel,
    ensSuffix: z.enum(ENS_SUFFIXES),
    walletNickname,
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((d, ctx) => {
    if (!d.currentPassword && !d.newPassword && !d.confirmPassword) return
    if (!d.currentPassword) ctx.addIssue({ code: 'custom', path: ['currentPassword'], message: 'Informe a senha atual' })
    if (d.newPassword.length < 8) {
      ctx.addIssue({ code: 'custom', path: ['newPassword'], message: 'A senha deve ter pelo menos 8 caracteres' })
    }
    if (d.newPassword !== d.confirmPassword) {
      ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'As senhas não coincidem' })
    }
  })

const address = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Endereço inválido: use 0x seguido de 40 caracteres hexadecimais')
/** "ENS ou carteira secundária (opcional)": vazio vira null */
const optionalEns = z
  .string()
  .trim()
  .transform((v) => v || null)
  .refine((v) => v === null || /^[a-z0-9-]{3,}\.(eth|base\.eth)$/.test(v) || /^0x[a-fA-F0-9]{40}$/.test(v), {
    message: 'Use um nome ENS (ex.: nome.eth) ou um endereço 0x',
  })

export const walletSchema = z.object({
  label: z.string().trim().min(2, 'Informe um nome').max(40, 'Máximo de 40 caracteres'),
  address,
  role: z.enum(['primary', 'secondary']),
  networks: z.array(z.enum(NETWORKS)).min(1, 'Selecione ao menos uma rede'),
  provider: z.enum(WALLET_PROVIDERS, { message: 'Selecione o tipo de carteira' }),
  ens: optionalEns.nullable().optional(),
})

/** select com placeholder: aceita '' na entrada (nada escolhido) e só sai com um valor da lista */
const choice = <const T extends readonly [string, ...string[]]>(values: T, message: string) =>
  z
    .union([z.enum(values), z.literal('')])
    .refine((v) => v !== '', { message })
    .transform((v) => v as T[number])

/** formulário inline da tela Carteiras (Figma): uma rede por carteira, escolhida num select */
export const walletFormSchema = z.object({
  label: z.string().trim().min(2, 'Informe o apelido da carteira').max(40, 'Máximo de 40 caracteres'),
  network: choice(NETWORKS, 'Selecione uma rede'),
  address,
  ens: optionalEns,
  provider: choice(WALLET_PROVIDERS, 'Selecione uma carteira'),
})

export const supportSchema = z.object({
  topic: choice(SUPPORT_TOPICS, 'Selecione um assunto'),
  orderId: z.string().nullable().optional(),
  message: z.string().trim().min(10, 'Descreva o problema em pelo menos 10 caracteres').max(1000, 'Máximo de 1000 caracteres'),
})

export type ProfileForm = z.infer<typeof profileSchema>
export type ProfileFormValues = z.infer<typeof profileFormSchema>
export type WalletForm = z.infer<typeof walletSchema>
export type WalletFormValues = z.input<typeof walletFormSchema>
export type WalletFormOutput = z.output<typeof walletFormSchema>
export type SupportForm = z.output<typeof supportSchema>
export type SupportFormInput = z.input<typeof supportSchema>
