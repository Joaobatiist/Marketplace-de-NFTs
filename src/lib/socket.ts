import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/contracts'

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export const socket: AppSocket = io(import.meta.env.VITE_SOCKET_URL, {
  // o MSW intercepta WebSocket; long-polling não é simulado
  transports: ['websocket'],
  autoConnect: false, // conecta só depois do MSW iniciar e da sessão ser conhecida
})
