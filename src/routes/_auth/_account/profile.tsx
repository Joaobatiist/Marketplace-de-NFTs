import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ENS_SUFFIXES, profileFormSchema, type ProfileFormValues, type User } from '@/contracts'
import { useSession } from '@/features/auth/queries'
import { useChangePassword, useUpdateProfile } from '@/features/account/queries'
import { toApiError } from '@/lib/http'
import { fileToAvatarDataUrl } from '@/lib/image'
import { AccountField, EnsField, FormAlert } from '@/features/account/components/form-controls'
import { submitButtonClass } from '@/features/account/form-styles'
import { AvatarEditor } from '@/features/account/components/avatar-editor'

export const Route = createFileRoute('/_auth/_account/profile')({ component: ProfilePage })

type EnsSuffix = (typeof ENS_SUFFIXES)[number]

/** "anasouza.base.eth" → nome + terminação (a terminação mais longa primeiro) */
function splitEns(ensName: string): { ensLabel: string; ensSuffix: EnsSuffix } {
  const suffix = [...ENS_SUFFIXES].sort((a, b) => b.length - a.length).find((s) => ensName.endsWith(s)) ?? '.eth'
  return { ensLabel: ensName.slice(0, ensName.length - suffix.length), ensSuffix: suffix }
}

const toFormValues = (user: User): ProfileFormValues => ({
  name: user.name,
  username: user.username,
  email: user.email,
  ...splitEns(user.ensName),
  walletNickname: user.walletNickname,
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

/** erros da API → campos do formulário (o ENS chega como `ensName`) */
const FIELD_FROM_API: Record<string, keyof ProfileFormValues> = { ensName: 'ensLabel' }

function ProfilePage() {
  const { session } = Route.useRouteContext()
  // a sessão do cache é atualizada pelo useUpdateProfile; o contexto da rota é o valor inicial
  const user = useSession().data?.user ?? session.user

  return (
    <div>
      <h1 className="text-[1.0625rem] font-bold">Perfil do colecionador</h1>
      <ProfileForm user={user} />
    </div>
  )
}

function ProfileForm({ user }: { user: User }) {
  const update = useUpdateProfile()
  const changePassword = useChangePassword()
  const [avatarError, setAvatarError] = useState<string>()
  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileFormSchema), defaultValues: toFormValues(user) })
  const { errors, isSubmitting } = form.formState

  const applyApiError = (error: unknown) => {
    const apiError = toApiError(error)
    Object.entries(apiError.fieldErrors ?? {}).forEach(([field, message]) =>
      form.setError(FIELD_FROM_API[field] ?? (field as keyof ProfileFormValues), { message }),
    )
    if (!apiError.fieldErrors) form.setError('root', { message: apiError.message })
  }

  const onSubmit = form.handleSubmit(async ({ ensLabel, ensSuffix, currentPassword, newPassword, ...profile }) => {
    let saved: User
    try {
      saved = await update.mutateAsync({ ...profile, ensName: `${ensLabel}${ensSuffix}` })
    } catch (error) {
      return applyApiError(error)
    }
    toast.success('Dados atualizados')

    // senha: só se algum campo de senha foi preenchido (o schema já validou os três)
    if (currentPassword || newPassword) {
      try {
        await changePassword.mutateAsync({ currentPassword, newPassword })
        toast.success('Senha alterada')
      } catch (error) {
        form.reset({ ...toFormValues(saved), currentPassword, newPassword, confirmPassword: newPassword })
        return applyApiError(error)
      }
    }
    form.reset(toFormValues(saved))
  })

  const saveAvatar = (avatarUrl: string | null, message: string) =>
    update.mutate(
      { avatarUrl },
      {
        onSuccess: () => {
          setAvatarError(undefined)
          toast.success(message)
        },
        onError: (e) => setAvatarError(toApiError(e).message),
      },
    )

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10 grid gap-x-7 gap-y-9 md:grid-cols-2">
      {errors.root && (
        <div className="md:col-span-2">
          <FormAlert>{errors.root.message}</FormAlert>
        </div>
      )}

      <AccountField label="Nome de exibição" required autoComplete="name" error={errors.name?.message} {...form.register('name')} />
      <AccountField
        label="Nome de usuário"
        required
        autoComplete="username"
        spellCheck={false}
        error={errors.username?.message}
        {...form.register('username')}
      />
      <AccountField label="E-mail" required type="email" autoComplete="email" error={errors.email?.message} {...form.register('email')} />
      <EnsField
        required
        suffixes={ENS_SUFFIXES}
        error={errors.ensLabel?.message}
        labelProps={form.register('ensLabel')}
        suffixProps={form.register('ensSuffix')}
      />
      <AccountField
        label="Apelido da carteira"
        required
        autoComplete="off"
        error={errors.walletNickname?.message}
        {...form.register('walletNickname')}
      />
      <AvatarEditor
        name={user.name}
        avatarUrl={user.avatarUrl}
        error={avatarError}
        isSaving={update.isPending && !isSubmitting}
        onSelectFile={async (file) => {
          try {
            saveAvatar(await fileToAvatarDataUrl(file), 'Foto atualizada')
          } catch (e) {
            setAvatarError(e instanceof Error ? e.message : 'Não foi possível ler a imagem.')
          }
        }}
        onRemove={() => saveAvatar(null, 'Foto removida')}
      />

      <section aria-labelledby="password-title" className="space-y-6 md:col-start-1">
        <h2 id="password-title" className="text-base font-bold">Alterar senha</h2>
        <AccountField
          label="Senha atual"
          type="password"
          revealable
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...form.register('currentPassword')}
        />
        <AccountField
          label="Nova senha"
          type="password"
          revealable
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...form.register('newPassword')}
        />
        <AccountField
          label="Confirmar nova senha"
          type="password"
          revealable
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...form.register('confirmPassword')}
        />
      </section>

      <div className="md:col-start-1">
        <button type="submit" disabled={isSubmitting} className={submitButtonClass}>
          {isSubmitting ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
