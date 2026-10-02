import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { registerFormSchema } from '@/contracts'
import { sessionQueryOptions, useRegister } from '@/features/auth/queries'
import { safeRedirect } from '@/features/auth/utils'
import { AuthShell } from '@/features/auth/components/auth-shell'
import { AuthInput } from '@/features/auth/components/auth-input'
import { authLinkClass, authSubmitClass } from '@/features/auth/styles'
import { toApiError } from '@/lib/http'

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
    <AuthShell
      mode="register"
      title="Criar perfil de colecionador"
      description="Crie seu perfil de colecionador e conecte uma carteira quando quiser."
      redirect={redirectTo}
      switchPrompt={
        <>
          Já tem uma conta?{' '}
          <Link to="/login" search={{ redirect: redirectTo }} className={authLinkClass}>
            Entre
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

        {/* "Nome de usuário" (Figma) é o nome mostrado no perfil; o identificador (@) é gerado a partir dele */}
        <AuthInput
          label="Nome de usuário"
          autoComplete="name"
          placeholder="Nome de usuário"
          className="[&_input]:max-lg:text-center"
          error={errors.name?.message}
          {...form.register('name')}
        />
        <AuthInput
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="Digite seu e-mail"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <AuthInput
          label="Senha"
          type="password"
          autoComplete="new-password"
          placeholder="Senha"
          revealable
          error={errors.password?.message}
          {...form.register('password')}
        />
        <AuthInput
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          placeholder="Confirmar senha"
          revealable
          error={errors.confirmPassword?.message}
          {...form.register('confirmPassword')}
        />

        <div className="pt-7 lg:pt-3">
          <button type="submit" disabled={isSubmitting} className={authSubmitClass}>
            {isSubmitting ? (
              'Criando…'
            ) : (
              <>
                <span className="lg:hidden">Criar perfil</span>
                <span className="hidden lg:inline">Criar conta</span>
              </>
            )}
          </button>
        </div>
      </form>
    </AuthShell>
  )
}
