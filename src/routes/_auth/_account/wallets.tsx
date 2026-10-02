import { useId, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Wallet, WalletFormOutput, WalletFormValues } from '@/contracts'
import { useSaveWallet, walletsQueryOptions } from '@/features/wallets/queries'
import { toApiError } from '@/lib/http'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/error-state'
import { AccountHeading, textActionClass } from '@/features/account/components/account-heading'
import { WalletForm } from '@/features/wallets/components/wallet-form'

export const Route = createFileRoute('/_auth/_account/wallets')({ component: WalletsPage })

type Role = Wallet['role']

const EMPTY_FORM: WalletFormValues = { label: '', network: '', address: '', ens: '', provider: '' }

const toFormValues = (wallet: Wallet): WalletFormValues => ({
  label: wallet.label,
  network: wallet.networks[0] ?? '',
  address: wallet.address,
  ens: wallet.ens ?? '',
  provider: wallet.provider,
})

function WalletsPage() {
  const { session } = Route.useRouteContext()
  const userId = session.user.id
  const wallets = useQuery(walletsQueryOptions(userId))

  if (wallets.isPending) {
    return (
      <div role="status" className="space-y-10">
        <span className="sr-only">Carregando carteiras…</span>
        <Skeleton className="h-[26rem] rounded-[3px]" />
        <Skeleton className="h-16 rounded-[3px]" />
      </div>
    )
  }
  if (!wallets.data) {
    return <ErrorState message={toApiError(wallets.error).message} onRetry={() => void wallets.refetch()} />
  }

  const primary = wallets.data.find((w) => w.role === 'primary')
  const secondary = wallets.data.find((w) => w.role === 'secondary')

  return (
    <div className="space-y-12">
      <h1 className="sr-only">Carteiras</h1>
      <WalletSection
        userId={userId}
        role="primary"
        title="Carteira principal"
        description="Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados."
        emptyText="Você ainda não adicionou uma carteira principal."
        wallet={primary}
      />
      <WalletSection
        userId={userId}
        role="secondary"
        title="Carteira secundária"
        emptyText="Você ainda não adicionou uma carteira secundária."
        wallet={secondary}
        primary={primary}
      />
    </div>
  )
}

interface WalletSectionProps {
  userId: string
  role: Role
  title: string
  description?: string
  emptyText: string
  wallet?: Wallet
  /** só na secundária: base para "Igual à carteira principal" */
  primary?: Wallet
}

/**
 * Uma seção por papel (Figma). Com carteira: formulário inline já preenchido para editar.
 * Sem carteira: texto de vazio + "Adicionar", que abre o mesmo formulário em branco.
 */
function WalletSection({ userId, role, title, description, emptyText, wallet, primary }: WalletSectionProps) {
  const titleId = useId()
  const sameId = useId()
  const save = useSaveWallet(userId)
  const [adding, setAdding] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const addRef = useRef<HTMLButtonElement>(null)
  const sectionRef = useRef<HTMLElement>(null)

  const handleSubmit = async (values: WalletFormOutput) => {
    try {
      await save.mutateAsync({
        id: wallet?.id,
        role,
        label: values.label,
        address: values.address,
        networks: [values.network],
        provider: values.provider,
        ens: values.ens,
      })
      toast.success(wallet ? 'Carteira atualizada' : 'Carteira cadastrada')
      setAdding(false)
      return null
    } catch (error) {
      return toApiError(error)
    }
  }

  const open = () => {
    setAdding(true)
    // leva o foco ao 1º campo do formulário que acabou de abrir
    requestAnimationFrame(() => sectionRef.current?.querySelector<HTMLElement>('form input, form select')?.focus())
  }

  const cancel = () => {
    setAdding(false)
    requestAnimationFrame(() => addRef.current?.focus())
  }

  // "Igual à carteira principal": copia apelido, rede, tipo e ENS; o endereço precisa ser outro
  const createValues: WalletFormValues =
    sameAsPrimary && primary ? { ...toFormValues(primary), address: '' } : EMPTY_FORM
  const showForm = !!wallet || adding

  const action = wallet ? undefined : adding ? (
    <button type="button" onClick={cancel} className={textActionClass}>
      Cancelar
    </button>
  ) : (
    <>
      {role === 'secondary' && (
        <label htmlFor={sameId} className="mr-1 inline-flex cursor-pointer items-center gap-2.5 text-sm has-disabled:cursor-not-allowed has-disabled:opacity-50">
          <input
            id={sameId}
            type="checkbox"
            checked={sameAsPrimary}
            disabled={!primary}
            onChange={(e) => setSameAsPrimary(e.target.checked)}
            className="size-4 shrink-0 cursor-pointer appearance-none rounded-full border-[1.5px] border-primary checked:bg-primary checked:shadow-[inset_0_0_0_2.5px_var(--color-background)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed"
          />
          Igual à carteira principal
        </label>
      )}
      <button ref={addRef} type="button" onClick={open} aria-describedby={titleId} className={textActionClass}>
        Adicionar
      </button>
    </>
  )

  return (
    <section ref={sectionRef} aria-labelledby={titleId} className="space-y-8">
      <AccountHeading
        as="h2"
        id={titleId}
        title={title}
        action={action}
        description={
          <>
            {description && <p>{description}</p>}
            {!showForm && <p>{emptyText}</p>}
          </>
        }
      />
      {showForm && (
        <WalletForm
          // a chave muda ao trocar a base do "Igual à principal": o formulário reabre com os novos valores
          key={wallet ? wallet.id : `new-${sameAsPrimary}`}
          defaultValues={wallet ? toFormValues(wallet) : createValues}
          onSubmit={handleSubmit}
        />
      )}
    </section>
  )
}
