// Gera lighthouse/SUMMARY.md a partir dos manifestos do LHCI (lighthouse/{mobile,desktop}/manifest.json):
// mediana das 3 execuções por página × perfil (categorias + LCP, CLS, TBT), metas ✓/✗,
// versões, ambiente e condições. Se existir lighthouse/ANALISE.md, o conteúdo entra no fim.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const ROOT = 'lighthouse'
const PROFILES = ['mobile', 'desktop']
const CATEGORIES = [
  { key: 'performance', label: 'Performance', goal: 0.9 },
  { key: 'accessibility', label: 'Accessibility', goal: 0.95 },
  { key: 'best-practices', label: 'Best Practices', goal: 0.95 },
  { key: 'seo', label: 'SEO', goal: 0.9 },
]
const METRICS = [
  { id: 'largest-contentful-paint', label: 'LCP', format: (v) => `${(v / 1000).toFixed(2)} s` },
  { id: 'cumulative-layout-shift', label: 'CLS', format: (v) => v.toFixed(3) },
  { id: 'total-blocking-time', label: 'TBT', format: (v) => `${Math.round(v)} ms` },
]

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const pagePath = (url) => new URL(url).pathname

const rows = []
let sample = null
for (const profile of PROFILES) {
  const manifestFile = path.join(ROOT, profile, 'manifest.json')
  if (!existsSync(manifestFile)) throw new Error(`não encontrado: ${manifestFile} (rode as auditorias antes)`)
  const byUrl = new Map()
  for (const entry of readJson(manifestFile)) {
    const report = readJson(entry.jsonPath)
    sample ??= report
    const list = byUrl.get(entry.url) ?? []
    list.push(report)
    byUrl.set(entry.url, list)
  }
  for (const [url, reports] of byUrl) {
    const scores = Object.fromEntries(CATEGORIES.map((c) => [c.key, median(reports.map((r) => r.categories[c.key].score))]))
    const metrics = Object.fromEntries(METRICS.map((m) => [m.id, median(reports.map((r) => r.audits[m.id].numericValue))]))
    rows.push({ profile, page: pagePath(url), runs: reports.length, scores, metrics })
  }
}

const lhciVersion = readJson('node_modules/@lhci/cli/package.json').version
const pct = (score) => Math.round(score * 100)
const lines = [
  '# Lighthouse — resumo',
  '',
  `Gerado em ${new Date().toISOString()} por \`scripts/lighthouse-summary.mjs\` (mediana de ${rows[0]?.runs ?? 0} execuções por página e perfil).`,
  '',
  '## Medianas',
  '',
  `| Página | Perfil | ${CATEGORIES.map((c) => `${c.label} (meta ${pct(c.goal)})`).join(' | ')} | ${METRICS.map((m) => m.label).join(' | ')} |`,
  `|---|---|${CATEGORIES.map(() => '---').join('|')}|${METRICS.map(() => '---').join('|')}|`,
  ...rows.map(
    (r) =>
      `| \`${r.page}\` | ${r.profile} | ${CATEGORIES.map((c) => `${pct(r.scores[c.key])} ${r.scores[c.key] >= c.goal ? '✓' : '✗'}`).join(' | ')} | ${METRICS.map((m) => m.format(r.metrics[m.id])).join(' | ')} |`,
  ),
  '',
  '## Versões e ambiente',
  '',
  `- Lighthouse: ${sample?.lighthouseVersion}`,
  `- @lhci/cli: ${lhciVersion}`,
  `- Node.js: ${process.version}`,
  `- Navegador: ${sample?.environment?.hostUserAgent ?? 'n/d'}`,
  `- Sistema: ${os.type()} ${os.release()} (${os.arch()}), ${os.cpus().length} CPUs — benchmarkIndex ${sample?.environment?.benchmarkIndex ?? 'n/d'}`,
  '',
  '## Condições',
  '',
  '- Build de produção (`npm run build`) servido por `vite preview` em `http://localhost:4173`.',
  '- Mocks ativos (`VITE_ENABLE_MOCKS=true`, cenário padrão: latência normal de 250 ms por requisição), imagens, fontes, Service Worker do MSW e tempo real carregados como na entrega — sem simplificações para a auditoria.',
  '- Perfil mobile: emulação padrão do Lighthouse (Moto G Power, 4G lento simulado, CPU 4×). Perfil desktop: `preset: desktop`.',
  `- ${rows[0]?.runs ?? 3} execuções por página e perfil; relatórios HTML/JSON em \`lighthouse/mobile\` e \`lighthouse/desktop\`. Configurações: \`lighthouserc.mobile.cjs\` e \`lighthouserc.desktop.cjs\`.`,
  '',
]

const analysis = path.join(ROOT, 'ANALISE.md')
if (existsSync(analysis)) lines.push(readFileSync(analysis, 'utf8').trim(), '')

writeFileSync(path.join(ROOT, 'SUMMARY.md'), lines.join('\n'))
console.log(`lighthouse/SUMMARY.md: ${rows.length} linhas (página × perfil)`)
for (const r of rows) console.log(`  ${r.page.padEnd(16)} ${r.profile.padEnd(8)} ${CATEGORIES.map((c) => `${c.label}=${pct(r.scores[c.key])}`).join(' ')}`)
