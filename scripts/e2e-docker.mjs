// Roda o Playwright no container oficial (Linux), na MESMA versão do @playwright/test instalado.
// É o ambiente das baselines visuais: a suíte inteira, regressão visual incluída, é reproduzível
// em qualquer sistema com Docker.
//   npm run test:e2e:docker                 → suíte completa
//   npm run test:e2e:docker:update          → regenera as baselines visuais
//   node scripts/e2e-docker.mjs <args>      → argumentos repassados ao `playwright test`
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync('node_modules/@playwright/test/package.json', 'utf8'))
const image = `mcr.microsoft.com/playwright:v${version}-noble`
const args = process.argv.slice(2).join(' ')

const result = spawnSync(
  'docker',
  [
    'run', '--rm', '--ipc=host',
    '-v', `${process.cwd()}:/work`,
    // node_modules próprio do container: não sobrescreve os binários nativos do host
    '-v', '/work/node_modules',
    '-w', '/work',
    image,
    'bash', '-c', `npm ci --no-audit --no-fund && npx playwright test ${args}`,
  ],
  { stdio: 'inherit' },
)
process.exit(result.status ?? 1)
