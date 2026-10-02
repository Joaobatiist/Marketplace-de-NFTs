import { z } from 'zod'
import { NETWORKS } from './wallet'

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

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome'),
  email,
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

export const walletSchema = z.object({
  label: z.string().trim().min(2, 'Informe um nome').max(40, 'Máximo de 40 caracteres'),
  address: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Endereço inválido: use 0x seguido de 40 caracteres hexadecimais'),
  role: z.enum(['primary', 'secondary']),
  networks: z.array(z.enum(NETWORKS)).min(1, 'Selecione ao menos uma rede'),
})

export type ProfileForm = z.infer<typeof profileSchema>
export type WalletForm = z.infer<typeof walletSchema>
