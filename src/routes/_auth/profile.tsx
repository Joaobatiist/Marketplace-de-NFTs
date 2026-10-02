import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { changePasswordFormSchema, profileSchema, type User } from '@/contracts'
import { useLogout, useSession } from '@/features/auth/queries'
import { useChangePassword, useUpdateProfile } from '@/features/account/queries'
import { toApiError } from '@/lib/http'
import { fileToAvatarDataUrl } from '@/lib/image'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/form/field'
import { AccountNav } from '@/features/account/components/account-nav'
import { AvatarEditor } from '@/features/account/components/avatar-editor'

export const Route = createFileRoute('/_auth/profile')({ component: ProfilePage })

type PersonalForm = Pick<z.infer<typeof profileSchema>, 'name' | 'email'>
type PasswordForm = z.infer<typeof changePasswordFormSchema>

function ProfilePage() {
  const { session } = Route.useRouteContext()
  // a sessão do cache é atualizada pelo useUpdateProfile; o contexto da rota é o valor inicial
  const user = useSession().data?.user ?? session.user
  const logout = useLogout()

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <AccountNav current="profile" onLogout={() => logout.mutate()} />
      <div className="min-w-0 space-y-8">
        <h1 className="text-2xl font-bold">Perfil do colecionador</h1>
        <PersonalSection key={`${user.name}|${user.email}`} user={user} />
        <AvatarSection user={user} />
        <PasswordSection />
      </div>
    </div>
  )
}

function PersonalSection({ user }: { user: User }) {
  const update = useUpdateProfile()
  const form = useForm<PersonalForm>({
    resolver: zodResolver(profileSchema.pick({ name: true, email: true })),
    defaultValues: { name: user.name, email: user.email },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync(values)
      toast.success('Dados atualizados')
    } catch (error) {
      const apiError = toApiError(error)
      Object.entries(apiError.fieldErrors ?? {}).forEach(([field, message]) =>
        form.setError(field as keyof PersonalForm, { message }),
      )
      form.setError('root', { message: apiError.message })
    }
  })

  return (
    <section aria-labelledby="personal-title" className="space-y-4 rounded-xl bg-card p-5 md:p-6">
      <h2 id="personal-title" className="text-lg font-bold">Dados pessoais</h2>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {errors.root && (
          <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">
            {errors.root.message}
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome de exibição" autoComplete="name" error={errors.name?.message} {...form.register('name')} />
          <Field label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...form.register('email')} />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : 'Salvar alterações'}
        </Button>
      </form>
    </section>
  )
}

function AvatarSection({ user }: { user: User }) {
  const update = useUpdateProfile()
  const [error, setError] = useState<string>()

  const save = (avatarUrl: string | null, message: string) =>
    update.mutate(
      { avatarUrl },
      {
        onSuccess: () => {
          setError(undefined)
          toast.success(message)
        },
        onError: (e) => setError(toApiError(e).message),
      },
    )

  return (
    <section aria-labelledby="avatar-title" className="space-y-4 rounded-xl bg-card p-5 md:p-6">
      <h2 id="avatar-title" className="text-lg font-bold">Avatar</h2>
      <AvatarEditor
        name={user.name}
        avatarUrl={user.avatarUrl}
        error={error}
        isSaving={update.isPending}
        onSelectFile={async (file) => {
          try {
            save(await fileToAvatarDataUrl(file), 'Foto atualizada')
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Não foi possível ler a imagem.')
          }
        }}
        onRemove={() => save(null, 'Foto removida')}
      />
    </section>
  )
}

function PasswordSection() {
  const changePassword = useChangePassword()
  const form = useForm<PasswordForm>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      // a API recebe só a senha atual e a nova (a confirmação é só do formulário)
      await changePassword.mutateAsync({ currentPassword, newPassword })
      form.reset()
      toast.success('Senha alterada')
    } catch (error) {
      const apiError = toApiError(error)
      Object.entries(apiError.fieldErrors ?? {}).forEach(([field, message]) =>
        form.setError(field as keyof PasswordForm, { message }),
      )
      form.setError('root', { message: apiError.message })
    }
  })

  return (
    <section aria-labelledby="password-title" className="space-y-4 rounded-xl bg-card p-5 md:p-6">
      <h2 id="password-title" className="text-lg font-bold">Alterar senha</h2>
      <form onSubmit={onSubmit} noValidate className="space-y-4 md:max-w-md">
        {errors.root && (
          <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">
            {errors.root.message}
          </p>
        )}
        <Field label="Senha atual" type="password" autoComplete="current-password" revealable error={errors.currentPassword?.message} {...form.register('currentPassword')} />
        <Field label="Nova senha" type="password" autoComplete="new-password" revealable error={errors.newPassword?.message} {...form.register('newPassword')} />
        <Field label="Confirmar nova senha" type="password" autoComplete="new-password" revealable error={errors.confirmPassword?.message} {...form.register('confirmPassword')} />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : 'Salvar nova senha'}
        </Button>
      </form>
    </section>
  )
}
