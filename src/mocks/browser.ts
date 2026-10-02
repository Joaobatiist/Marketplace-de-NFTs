import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { db, resetDb, updateEdition } from './db'
import { dropAllConnections, emitNftUpdated, emitRaw } from './realtime'

export const worker = setupWorker(...handlers)

// apoio a testes manuais e E2E: window.__mock.updateEdition(...)
Object.assign(window, {
  __mock: { db, resetDb, updateEdition, emitNftUpdated, emitRaw, dropAllConnections },
})
