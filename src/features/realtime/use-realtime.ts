import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts'
import { useSession } from '@/features/auth/queries'
import { nftKeys } from '@/features/catalog/queries'
import { cartKeys } from '@/features/cart/queries'
import { tokenStorage } from '@/lib/http'
import { socket } from '@/lib/socket'
import { applyNftUpdated, applyOrderUpdated, markSeen, resetSeen } from './apply-events'

export type RealtimeStatus = 'connecting' | 'connected' | 'reconnecting'

export function useRealtime(): RealtimeStatus {
  const queryClient = useQueryClient()
  const session = useSession()
  const userId = session.data?.user.id ?? null
  const [status, setStatus] = useState<RealtimeStatus>('connecting')
  const hasConnected = useRef(false)

  useEffect(() => {
    if (session.isPending) return
    const owner = userId ?? 'guest'
    resetSeen()
    hasConnected.current = false

    const onConnect = () => {
      socket.emit('session.join', tokenStorage.get())
      setStatus('connected')
      if (hasConnected.current) {
        // reconexão: eventos podem ter sido perdidos; reconcilia o que está na tela com a API REST
        void queryClient.invalidateQueries({ queryKey: nftKeys.all, refetchType: 'active' })
        void queryClient.invalidateQueries({ queryKey: cartKeys.cart(owner), refetchType: 'active' })
        void queryClient.invalidateQueries({ queryKey: cartKeys.quotes(owner), refetchType: 'active' })
        void queryClient.invalidateQueries({ queryKey: ['order', owner], refetchType: 'active' })
      }
      hasConnected.current = true
    }

    const onDisconnect = () => setStatus('reconnecting')

    const onNftUpdated = (event: NftUpdatedEvent) => {
      if (!markSeen(event.eventId)) return
      const changedItem = applyNftUpdated(queryClient, event, owner)
      if (changedItem) toast.warning(`${changedItem}: preço ou disponibilidade mudou. Revise seu carrinho.`)
    }

    const onOrderUpdated = (event: OrderUpdatedEvent) => {
      if (!userId || !markSeen(event.eventId)) return
      applyOrderUpdated(queryClient, event, userId)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onDisconnect)
    socket.on('nft.updated', onNftUpdated)
    socket.on('order.updated', onOrderUpdated)
    socket.connect() // nova conexão a cada troca de usuário

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onDisconnect)
      socket.off('nft.updated', onNftUpdated)
      socket.off('order.updated', onOrderUpdated)
      socket.disconnect()
    }
  }, [queryClient, userId, session.isPending])

  return status
}
