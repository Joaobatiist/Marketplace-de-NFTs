import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { db } from '../db'
import { clients, type RealtimeClient } from '../realtime'

const realtime = ws.link(`${import.meta.env.VITE_SOCKET_URL}/*`)

export const realtimeHandlers = [
  realtime.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection)
    const client: RealtimeClient = {
      io,
      close: () => connection.client.close(),
      userId: null,
    }
    clients.add(client)

    io.client.on('session.join', (_event, token: string | null) => {
      const session = token
        ? db.sessions.find((s) => s.token === token && new Date(s.expiresAt).getTime() > Date.now())
        : undefined
      client.userId = session?.userId ?? null
    })

    connection.client.addEventListener('close', () => clients.delete(client))
  }),
]
