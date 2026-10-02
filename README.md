# Kurio — Marketplace de NFTs

Marketplace de NFTs com catálogo filtrável, detalhe com edições, favoritos, carrinho no servidor com cupom, checkout com carteira e pagamento simulado idempotente, recibo, conta (perfil, avatar, senha, carteiras) e preços atualizados em tempo real por Socket.IO. O backend é simulado no navegador com **MSW** (REST + WebSocket), com cenários de rede e falha configuráveis, persistência em `localStorage` e reset. Fluxos, falhas e regressão visual são cobertos por testes E2E com Playwright.

- **Deploy:** _(preencher com a URL da Vercel após o deploy)_
- **Repositório:** https://github.com/Joaobatiist/Marketplace-de-NFTs

## Stack

React 19 · TypeScript · Vite 8 · TanStack Router (rotas por arquivo, code splitting) · TanStack Query · Axios · Tailwind CSS 4 + shadcn/ui (Radix) · react-hook-form + Zod · MSW 3 + `@mswjs/socket.io-binding` · socket.io-client · decimal.js · Sonner · Playwright · Lighthouse CI.

## Requisitos

- Node.js `^20.19.0 || >=22.12.0` (testado com 24.11) e npm 10+.
- Docker (opcional): só para rodar a regressão visual fora do Linux (`npm run test:e2e:docker`).

## Setup

```bash
npm ci
npx playwright install chromium
npm run dev          # http://localhost:5173
```

## Variáveis de ambiente

Versionadas em `.env.development` e `.env.production` (não contêm segredos).

| Variável | Valor | Para que serve |
|---|---|---|
| `VITE_ENABLE_MOCKS` | `true` | Liga o MSW (API e tempo real simulados no navegador) e o painel de cenários. Com `false`, o app chama a API real. |
| `VITE_API_URL` | `/api` | Base do Axios. |
| `VITE_SOCKET_URL` | `wss://realtime.nft-marketplace.mock` | Endereço do Socket.IO. O host é fictício de propósito: o MSW intercepta a conexão dentro da página. |

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (com devtools do Router e do Query). |
| `npm run build` | `tsc -b` + build de produção em `dist/`. |
| `npm run preview` | Serve o build (`http://localhost:4173`). |
| `npm run typecheck` | Checagem de tipos (app, config e testes E2E). |
| `npm run lint` | ESLint. |
| `npm run test:e2e` | Playwright contra o build de produção (desktop 1440×900 e mobile 390×844). |
| `npm run test:e2e:update` | Atualiza snapshots. |
| `npm run test:e2e:report` | Abre o relatório HTML da última execução. |
| `npm run test:e2e:docker` | Suíte completa no container oficial do Playwright (Linux), incluindo a regressão visual. |
| `npm run test:e2e:docker:update` | Regenera as baselines visuais no container. |
| `npm run lighthouse` | Build + Lighthouse (mobile e desktop, 3 execuções por página) + `lighthouse/SUMMARY.md`. |

## Credenciais fictícias

| Usuário | E-mail | Senha | Observação |
|---|---|---|---|
| Ana Souza | `ana@teste.com` | `Senha@123` | Carteira principal (Ethereum, Base) e secundária (Polygon) |
| Bruno Lima | `bruno@teste.com` | `Senha@123` | Sem carteiras (testa o estado vazio) |

Cupons: `JUNGLE10` (10% de desconto) e `EXPIRADO` (expirado). Qualquer outro código é inválido.

## Cenários de rede e falha

Ative pela URL (`?scenario=<preset>`) ou pelo **painel "Cenários"** (botão flutuante no canto inferior). O cenário fica salvo no `localStorage` até ser trocado ou resetado.

| Preset | Efeito |
|---|---|
| `default` | Latência normal (250 ms por requisição). |
| `fast` | Sem latência (usado nos testes E2E). |
| `slow` | 2,5 s por requisição: skeletons visíveis. |
| `jitter` | Latências em sequência fixa (1200, 150, 700…): respostas fora de ordem, de forma reproduzível. |
| `offline` | Erro de rede (sem resposta). |
| `server-error` | 503 nas leituras (GET). |
| `favorites-fail` | 503 ao favoritar/desfavoritar (rollback do otimista). |
| `order-timeout` | O pedido é criado, mas a 1ª resposta só chega depois do timeout de 10 s do cliente. |
| `payment-declined` | O pagamento simulado é recusado. |
| `wallet-rejected` | A carteira recusa a conexão. |

**Reset:** `?reset=1` (ex.: `/?reset=1&scenario=payment-declined`) ou "Resetar dados" no painel. Volta ao banco seed, cenário padrão, sem sessão, sem carrinho de visitante e sem tentativa de checkout.

## Como reproduzir cada falha

O helper `window.__mock` fica disponível no console quando os mocks estão ligados.

| Falha | Passo a passo |
|---|---|
| Sessão expirada | Logado, numa rota protegida (ex.: `/wallets`): painel → "Expirar sessão" (ou `fetch('/api/__dev/expire-sessions', { method: 'POST' })` e navegue). O app vai ao login e volta para a mesma rota depois de entrar. |
| Preço alterado no checkout | Com o `nft_001` (Standard) no carrinho, na revisão do pagamento: `__mock.updateEdition('nft_001', 'nft_001_std', { price: '9.999' })`. A revisão atualiza pelo tempo real e "Confirmar compra" bloqueia até "Atualizar carrinho". |
| Pagamento recusado | `/?scenario=payment-declined` e compre: "Pagamento recusado", os itens continuam no carrinho. |
| Timeout com recuperação | `/?scenario=order-timeout` e compre: ~11 s depois o retry com a mesma `Idempotency-Key` recupera o pedido; `Object.keys(__mock.db.orders)` mostra um único pedido. |
| Clique duplo | Clique várias vezes em "Confirmar compra": um único pedido (`Object.keys(__mock.db.orders)`). |
| F5 durante o pendente | Confirme a compra e recarregue antes de 5 s: o mesmo pedido é recuperado e o recibo aparece. |
| Queda do tempo real | `__mock.dropAllConnections()`: aparece o banner "Conexão em tempo real perdida. Reconectando…"; ao reconectar, o app reconcilia com a API. |
| Evento duplicado | `__mock.emitNftUpdated(__mock.db.nfts[0])` duas vezes: o segundo é ignorado (mesmo `eventId`). |
| Evento antigo | `__mock.emitRaw('nft.updated', { eventId: 'old-1', type: 'nft.updated', resourceId: 'nft_001', version: 1, occurredAt: new Date().toISOString(), payload: { editions: [{ editionId: 'nft_001_std', price: '0.001', available: 50 }] } })`: o preço não regride. |

## Testes

`npm run test:e2e` faz o build, sobe o `vite preview` e roda 11 arquivos em `e2e/` nos projetos desktop e mobile: catálogo (busca, filtros, ordenação, paginação, voltar/avançar, refresh), detalhe, autenticação (cadastro, validação, rota protegida, expiração de sessão na navegação e no checkout, troca de usuário sem vazar dados), favoritos (otimista e rollback), carrinho e cupons, checkout (compra completa, clique repetido, recusa, timeout, refresh no pendente, carteira recusada, recibo de outro usuário), tempo real (preço ao vivo, duplicata, evento antigo, reconexão), conta (perfil, avatar, senha, carteiras), acessibilidade (teclado, skip link, foco preso em Sheets, erros associados), carregamento/falha e regressão visual.

Cada teste parte de um estado isolado (`?reset=1&scenario=fast`). Os eventos de tempo real são disparados pelo servidor simulado (`window.__mock`) e chegam pelo `socket.io-client`; nenhum teste altera o cache ou a UI diretamente.

- Relatório HTML: `npm run test:e2e:report` (em `playwright-report/`).
- Traces das falhas: `test-results/` (`npx playwright show-trace <arquivo>.zip`).
- **Baselines visuais** (`e2e/__screenshots__/`): geradas em Linux, no container `mcr.microsoft.com/playwright:v1.63.0-noble`. A renderização de fonte muda entre sistemas, então fora do Linux os 8 testes visuais aparecem como *skipped*. Para rodá-los em qualquer sistema: `npm run test:e2e:docker`.

## Lighthouse

`npm run lighthouse` audita `/` e `/nfts/nft_001` nos perfis mobile e desktop (3 execuções cada) contra o build de produção, com os mocks no cenário padrão. Relatórios HTML/JSON em `lighthouse/mobile` e `lighthouse/desktop`; medianas, versões, ambiente e análise em [`lighthouse/SUMMARY.md`](lighthouse/SUMMARY.md). Configurações: `lighthouserc.mobile.cjs` e `lighthouserc.desktop.cjs`.

Mais detalhes de arquitetura, contratos e decisões em [`ARCHITECTURE.md`](ARCHITECTURE.md).
