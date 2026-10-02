import { accountHandlers } from './account'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { favoriteHandlers } from './favorites'
import { networkHandlers } from './network'
import { nftHandlers } from './nfts'
import { orderHandlers } from './orders'
import { realtimeHandlers } from './realtime'
import { walletHandlers } from './wallets'

export const handlers = [
  // primeiro: latência e falhas de rede do cenário; sem falha, segue para o handler real
  ...networkHandlers,
  ...authHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...accountHandlers,
  ...walletHandlers,
  ...orderHandlers,
  ...realtimeHandlers,
]
