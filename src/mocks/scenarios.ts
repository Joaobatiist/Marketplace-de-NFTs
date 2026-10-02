const STORAGE_KEY = 'nft-marketplace:scenario'

export type Latency = 'fast' | 'normal' | 'slow' | 'jitter'

export interface ScenarioConfig {
  latency: Latency
  offline: boolean
  failReads: boolean
  failFavorites: boolean
  orderTimeoutOnce: boolean
  payment: 'approve' | 'decline'
  wallet: 'approve' | 'reject'
}

export const DEFAULT_SCENARIO: ScenarioConfig = {
  latency: 'normal',
  offline: false,
  failReads: false,
  failFavorites: false,
  orderTimeoutOnce: false,
  payment: 'approve',
  wallet: 'approve',
}

export const PRESETS = {
  default: {},
  fast: { latency: 'fast' }, // usado nos testes E2E
  slow: { latency: 'slow' }, // skeletons visíveis
  jitter: { latency: 'jitter' }, // respostas fora de ordem
  offline: { offline: true }, // falha de conexão
  'server-error': { failReads: true }, // 503 nas leituras
  'favorites-fail': { failFavorites: true }, // rollback do otimista
  'order-timeout': { orderTimeoutOnce: true }, // pedido criado, resposta perdida
  'payment-declined': { payment: 'decline' },
  'wallet-rejected': { wallet: 'reject' },
} satisfies Record<string, Partial<ScenarioConfig>>

export type PresetName = keyof typeof PRESETS

export const isPreset = (name: string): name is PresetName => name in PRESETS

function load(): ScenarioConfig {
  try {
    return { ...DEFAULT_SCENARIO, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
  } catch {
    return { ...DEFAULT_SCENARIO }
  }
}

let config = load()

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export const scenario = {
  get: () => config,
  set(patch: Partial<ScenarioConfig>) {
    config = { ...config, ...patch }
    save()
  },
  applyPreset(name: PresetName) {
    config = { ...DEFAULT_SCENARIO, ...PRESETS[name] }
    save()
  },
  reset() {
    config = { ...DEFAULT_SCENARIO }
    localStorage.removeItem(STORAGE_KEY)
  },
}

// sequência fixa: a 1ª requisição demora mais que a 2ª, de forma reproduzível
const JITTER_MS = [1200, 150, 700, 90, 1000, 250]
let jitterIndex = 0

export function latencyMs() {
  switch (config.latency) {
    case 'fast':
      return 0
    case 'slow':
      return 2500
    case 'jitter':
      return JITTER_MS[jitterIndex++ % JITTER_MS.length]
    default:
      return 250
  }
}
