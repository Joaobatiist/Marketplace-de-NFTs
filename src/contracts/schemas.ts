import { z } from 'zod'

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