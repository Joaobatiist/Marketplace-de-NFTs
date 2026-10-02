/** evita open redirect: só aceita caminhos internos */
export function safeRedirect(target?: string) {
  return target?.startsWith('/') && !target.startsWith('//') ? target : '/'
}