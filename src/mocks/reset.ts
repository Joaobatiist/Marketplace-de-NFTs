import { resetDb } from './db'
import { scenario } from './scenarios'

const APP_PREFIX = 'nft-marketplace:'
const DB_KEY_PREFIX = 'nft-marketplace:mock-db:'

/** restaura um estado conhecido: banco seed, cenário padrão, sem sessão, sem carrinho de visitante */
export function resetAll() {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(APP_PREFIX) && !key.startsWith(DB_KEY_PREFIX)) localStorage.removeItem(key)
  }
  scenario.reset()
  resetDb()
}
