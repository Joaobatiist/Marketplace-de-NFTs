import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { loginSchema, type LoginRequest } from '@/contracts'
import { sessionQueryOptions, useLogin } from '@/features/auth/queries'
import { safeRedirect } from '@/features/auth/utils'
import { toApiError } from '@/lib/http'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/login')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions)
    if (session) throw redirect({ href: safeRedirect(search.redirect) })
  },
  component: LoginPage,
})

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch()
  const router = useRouter()
  const login = useLogin()
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values)
      await router.invalidate()
      router.history.push(safeRedirect(redirectTo))
    } catch (error) {
      const apiError = toApiError(error)
      Object.entries(apiError.fieldErrors ?? {}).forEach(([field, message]) =>
        form.setError(field as keyof LoginRequest, { message }),
      )
      form.setError('root', { message: apiError.message })
    }
  })

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">Entrar</h1>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {errors.root && (
          <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">
            {errors.root.message}
          </p>
        )}

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
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...form.register('password')}
          />
          {errors.password && <p id="password-error" className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        Não tem conta?{' '}
        <Link to="/register" search={{ redirect: redirectTo }} className="underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}