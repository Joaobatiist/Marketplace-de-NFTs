import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { loginSchema, type LoginRequest } from '@/contracts'
import { sessionQueryOptions, useLogin } from '@/features/auth/queries'
import { safeRedirect } from '@/features/auth/utils'
import { AuthShell } from '@/features/auth/components/auth-shell'
import { AuthInput } from '@/features/auth/components/auth-input'
import { authLinkClass, authSubmitClass } from '@/features/auth/styles'
import { toApiError } from '@/lib/http'

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
    <AuthShell
      mode="login"
      title="Entrar"
      description="Entre para gerenciar sua carteira, coleção e perfil de criador."
      redirect={redirectTo}
      switchPrompt={
        <>
          Novo na Kurio?{' '}
          <Link to="/register" search={{ redirect: redirectTo }} className={authLinkClass}>
            Crie uma conta
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-3">
        {errors.root && (
          <p role="alert" className="rounded-[3px] border border-destructive p-3 text-sm text-destructive">
            {errors.root.message}
          </p>
        )}

        <AuthInput
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="contato@email.com"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <AuthInput
          label="Senha"
          type="password"
          autoComplete="current-password"
          placeholder="Senha"
          revealable
          error={errors.password?.message}
          {...form.register('password')}
        />

        <div className="flex justify-end pt-1">
          {/* estático: recuperação de senha não faz parte do escopo */}
          <button
            type="button"
            aria-disabled="true"
            onClick={() => toast.info('Recuperação de senha ainda não está disponível.')}
            className={`${authLinkClass} text-sm`}
          >
            Esqueceu a senha?
          </button>
        </div>

        <div className="pt-6 lg:pt-3">
          <button type="submit" disabled={isSubmitting} className={authSubmitClass}>
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </form>
    </AuthShell>
  )
}
