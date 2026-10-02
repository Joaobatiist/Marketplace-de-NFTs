import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Wallet, WalletForm as WalletFormValues } from '@/contracts'
import { useLogout } from '@/features/auth/queries'
import { useSaveWallet, walletsQueryOptions } from '@/features/wallets/queries'
import { toApiError } from '@/lib/http'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { AccountNav } from '@/features/account/components/account-nav'
import { WalletCard, WalletCardSkeleton } from '@/features/wallets/components/wallet-card'
import { WalletForm } from '@/features/wallets/components/wallet-form'

export const Route = createFileRoute('/_auth/wallets')({ component: WalletsPage })

type Editing = { mode: 'create' } | { mode: 'edit'; wallet: Wallet }

function WalletsPage() {
  const { session } = Route.useRouteContext()
  const userId = session.user.id
  const logout = useLogout()
  const wallets = useQuery(walletsQueryOptions(userId))
  const save = useSaveWallet(userId)
  const [editing, setEditing] = useState<Editing | null>(null)
  // botão que abriu o dialog: o foco volta para ele ao fechar (o "Adicionar" do estado vazio some depois do 1º cadastro)
  const triggerRef = useRef<HTMLElement | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const open = (next: Editing, trigger: HTMLElement | null) => {
    triggerRef.current = trigger
    setEditing(next)
  }

  const list = wallets.data ?? []
  const canAdd = list.length < 2
  const missingRole = list.some((w) => w.role === 'primary') ? 'secondary' : 'primary'

  const defaultValues: WalletFormValues =
    editing?.mode === 'edit'
      ? { label: editing.wallet.label, address: editing.wallet.address, role: editing.wallet.role, networks: editing.wallet.networks }
      : { label: '', address: '', role: missingRole, networks: ['ethereum'] }

  const handleSubmit = async (values: WalletFormValues) => {
    try {
      await save.mutateAsync(editing?.mode === 'edit' ? { ...values, id: editing.wallet.id } : values)
      setEditing(null)
      toast.success(editing?.mode === 'edit' ? 'Carteira atualizada' : 'Carteira cadastrada')
      return null
    } catch (error) {
      return toApiError(error)
    }
  }

  function renderContent() {
    if (wallets.isPending) {
      return (
        <div role="status" className="space-y-4">
          <span className="sr-only">Carregando carteiras…</span>
          <WalletCardSkeleton />
          <WalletCardSkeleton />
        </div>
      )
    }
    if (!wallets.data) {
      return <ErrorState message={toApiError(wallets.error).message} onRetry={() => void wallets.refetch()} />
    }
    if (list.length === 0) {
      return (
        <EmptyState
          title="Nenhuma carteira cadastrada"
          description="Cadastre uma carteira para concluir compras e receber seus NFTs."
          actionLabel="Adicionar carteira"
          onAction={() => open({ mode: 'create' }, document.activeElement as HTMLElement)}
        />
      )
    }
    return (
      <ul className="space-y-4">
        {list.map((wallet) => (
          <li key={wallet.id}>
            <WalletCard wallet={wallet} onEdit={(trigger) => open({ mode: 'edit', wallet }, trigger)} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <AccountNav current="wallets" onLogout={() => logout.mutate()} />
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">Carteiras</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
            </p>
          </div>
          {wallets.data && list.length > 0 && canAdd && (
            <Button onClick={(e) => open({ mode: 'create' }, e.currentTarget)}>
              <Plus aria-hidden="true" className="size-4" />
              Adicionar carteira
            </Button>
          )}
        </div>
        {renderContent()}
      </div>

      <Dialog open={!!editing} onOpenChange={(isOpen) => !isOpen && setEditing(null)}>
        <DialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            const trigger = triggerRef.current
            ;(trigger?.isConnected ? trigger : headingRef.current)?.focus()
          }}
        >
          <DialogHeader>
            <DialogTitle>{editing?.mode === 'edit' ? 'Editar carteira' : 'Adicionar carteira'}</DialogTitle>
            <DialogDescription>Rótulo, endereço, papel e redes em que a carteira opera.</DialogDescription>
          </DialogHeader>
          {editing && (
            <WalletForm
              key={editing.mode === 'edit' ? editing.wallet.id : 'new'}
              defaultValues={defaultValues}
              submitLabel={editing.mode === 'edit' ? 'Salvar alterações' : 'Salvar carteira'}
              onSubmit={handleSubmit}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
