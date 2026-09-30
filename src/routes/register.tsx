import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { registerFormSchema } from '@/contracts'
import { sessionQueryOptions, useRegister } from '@/features/auth/queries'
import { safeRedirect } from '@/features/auth/utils'
import { toApiError } from '@/lib/http'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type RegisterForm = z.infer<typeof registerFormSchema>

export const Route = createFileRoute('/register')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions)
    if (session) throw redirect({ href: safeRedirect(search.redirect) })
  },
  component: RegisterPage,
})

function RegisterPage() {
  const { redirect: redirectTo } = Route.useSearch()
  const router = useRouter()
  const registerUser = useRegister()
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async ({ name, email, password }) => {
    try {
      // confirmPassword só existe no formulário; a API recebe apenas o RegisterRequest
      await registerUser.mutateAsync({ name, email, password })
      await router.invalidate()
      router.history.push(safeRedirect(redirectTo))
    } catch (error) {
      const apiError = toApiError(error)
      Object.entries(apiError.fieldErrors ?? {}).forEach(([field, message]) =>
        form.setError(field as keyof RegisterForm, { message }),
      )
      form.setError('root', { message: apiError.message })
    }
  })

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">Criar conta</h1>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {errors.root && (
          <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">
            {errors.root.message}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            {...form.register('name')}
          />
          {errors.name && <p id="name-error" className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...form.register('email')}
          />
          {errors.email && <p id="email-error" className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...form.register('password')}
          />
          {errors.password && <p id="password-error" className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            {...form.register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        Já tem conta?{' '}
        <Link to="/login" search={{ redirect: redirectTo }} className="underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
