const PREFIX = 'nft-marketplace:scenario:'

export type ScenarioName = 'payment' | 'wallet'

export const scenario = {
  get: (name: ScenarioName) => localStorage.getItem(PREFIX + name),
}
