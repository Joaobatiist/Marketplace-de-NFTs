# Arquitetura

## 1. Estrutura de pastas

| Pasta | Responsabilidade |
|---|---|
| `src/routes/` | Rotas por arquivo (TanStack Router). Cada rota busca dados com TanStack Query e compõe componentes. `_auth.tsx` protege `/profile`, `/wallets`, `/checkout` e `/orders/$orderId` (`beforeLoad` com a sessão). |
| `src/features/<domínio>/` | `api.ts` (chamadas Axios), `queries.ts` (query options, chaves e mutations), `components/` (apresentacionais: dados só por props). Domínios: `auth`, `catalog`, `nft`, `favorites`, `cart`, `checkout`, `wallets`, `account`, `realtime`. |
| `src/contracts/` | Tipos e schemas Zod compartilhados entre app e mock (o "contrato" da API). |
| `src/mocks/` | Backend simulado: banco (`db.ts`), regras (`quote.ts`, `orders.ts`), handlers REST/WebSocket, tempo real (`realtime.ts`), cenários (`scenarios.ts`), reset. |
| `src/lib/` | Infra: cliente HTTP e sessão (`http.ts`), Query Client, socket, ETH/decimal, imagem do avatar. |
| `src/components/` | UI genérica (shadcn/ui em `ui/`, layout, feedback, formulário). |
| `src/dev/` | Painel de cenários (carregado só com mocks). |
| `e2e/` | Testes Playwright, fixtures e baselines visuais. |

`src/main.tsx` inicia o MSW e só depois importa `src/app.tsx` (router, providers, render) — ver seção 4.

## 2. Contratos REST

Erros seguem `ApiError { code, message, fieldErrors? }`. Rotas autenticadas usam `Authorization: Bearer <token>`; todas enviam `X-Guest-Id` (carrinho de visitante).

| Método | Rota | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | 201 `AuthResponse` | 422 `VALIDATION_ERROR`, 409 `CONFLICT` (e-mail) |
| POST | `/api/auth/login` | `{ email, password }` | 200 `AuthResponse` (mescla o carrinho de visitante) | 422, 401 `UNAUTHORIZED` |
| GET | `/api/auth/session` | — | 200 `Session` | 401 `UNAUTHORIZED` / `SESSION_EXPIRED` |
| POST | `/api/auth/logout` | — | 204 | — |
| GET | `/api/nfts` | query: `q, category, minPrice, maxPrice, onlyAvailable, sort, page, pageSize` | 200 `Paginated<Nft>` | — |
| GET | `/api/nfts/featured` | — | 200 `Nft[]` | — |
| GET | `/api/nfts/:nftId` | — | 200 `Nft` | 404 `NOT_FOUND` |
| GET | `/api/favorites` | — | 200 `{ nftIds }` | 401 |
| PUT / DELETE | `/api/favorites/:nftId` | — | 204 (idempotentes) | 401, 404 |
| GET | `/api/cart` | — | 200 `Cart` | 401 (token inválido) |
| POST | `/api/cart/items` | `{ nftId, editionId, quantity }` (soma) | 200 `Cart` | 404, 422, 409 `OUT_OF_STOCK` |
| PUT | `/api/cart/items` | `{ nftId, editionId, quantity }` (define) | 200 `Cart` | 404, 422, 409 `OUT_OF_STOCK` |
| DELETE | `/api/cart/items/:nftId/:editionId` | — | 200 `Cart` | — |
| POST / DELETE | `/api/cart/coupon` | `{ code }` | 200 `Cart` | 422 `COUPON_INVALID` / `COUPON_EXPIRED` |
| POST | `/api/cart/acknowledge` | — | 200 `Cart` (aceita preços/estoque atuais) | — |
| POST | `/api/quotes` | `{ network }` | 200 `Quote` (com `issues`) | 401 |
| GET | `/api/wallets` | — | 200 `Wallet[]` | 401 |
| POST | `/api/wallets` | `{ label, address, role, networks }` | 201 `Wallet` | 422, 409 `CONFLICT` (papel, endereço, limite de 2) |
| PUT | `/api/wallets/:walletId` | idem | 200 `Wallet` | 404, 422, 409 |
| POST | `/api/wallets/:walletId/connect` | `{ network }` | 200 `WalletConnection` | 404, 422, 403 `WALLET_REJECTED` |
| POST | `/api/orders` | `CreateOrderRequest` + header `Idempotency-Key` | 201 `Order` (`pending`); repetição da chave → o mesmo pedido | 409 `IDEMPOTENCY_CONFLICT`, 409 `QUOTE_OUTDATED`, 422 |
| GET | `/api/orders/:orderId` | — | 200 `Order` (resolve o pagamento se o prazo passou) | 404 (também para pedido de outro usuário) |
| GET / PATCH | `/api/profile` | `{ name?, email?, avatarUrl? }` | 200 `User` | 422, 409 (e-mail) |
| POST | `/api/profile/password` | `{ currentPassword, newPassword }` | 200 `{ ok: true }` | 422 (`currentPassword` / `newPassword`) |
| POST | `/api/__dev/expire-sessions` | — | 204 (apoio a testes) | — |

Todas as rotas `/api/*` passam primeiro pelo handler de rede (`handlers/network.ts`), que aplica latência e falhas do cenário (erro de rede ou 503 `SERVICE_UNAVAILABLE`) e, sem falha, segue para o handler real.

## 3. Contratos de eventos (Socket.IO)

Todo evento tem `eventId` (identidade estável, `tipo:recurso:versão`), `type`, `resourceId`, `version` (versão do recurso após o evento), `occurredAt` e `payload`.

| Evento | Direção | Payload | Quem recebe |
|---|---|---|---|
| `nft.updated` | servidor → cliente | `{ editions: [{ editionId, price, available }] }` | todas as conexões |
| `order.updated` | servidor → cliente | `{ status, txHash, declineReason }` | só as conexões do dono do pedido |
| `session.join` | cliente → servidor | `token \| null` | identifica o usuário da conexão |

O `nft.updated` sai de um único lugar (`updateEdition` no `db.ts`), então REST e socket nunca divergem.

## 4. Transporte de tempo real

O "servidor" é simulado pelo MSW com `@mswjs/socket.io-binding` (`ws.link('wss://realtime.nft-marketplace.mock/*')`); o cliente usa o `socket.io-client` de verdade com `transports: ['websocket']` — o MSW intercepta a classe `WebSocket` dentro da página, e o long-polling do Socket.IO não é simulado. O host é fictício: a conexão nunca sai do navegador.

**Ordem de carregamento:** o engine.io-client guarda `globalThis.WebSocket` no momento em que o módulo é avaliado. Por isso o `main.tsx` inicia o MSW e só então importa o app (`import('./app')`); se o app fosse importado estaticamente, o socket capturaria o WebSocket nativo e tentaria a rede.

Limitações: o binding declara `peer msw@^2`; o projeto usa MSW 3 com `overrides` no `package.json` (funcionamento coberto pelos testes de tempo real). Cada aba tem o próprio "servidor" em memória: eventos não cruzam abas.

## 5. Política de sessão

- Token no `localStorage` + header `Authorization` (com cookie `httpOnly` o token ficaria fora do alcance de XSS, mas exigiria backend/CSRF; aqui o backend é simulado no navegador). TTL de 30 min no servidor.
- Expiração: o interceptor do Axios trata 401 `SESSION_EXPIRED`/`UNAUTHORIZED` (só se havia token): limpa token, limpa o cache e reexecuta os `beforeLoad`; uma rota protegida redireciona para `/login?redirect=<rota atual>`. Vale durante a navegação e no checkout (os testes cobrem os dois).
- `safeRedirect` só aceita caminhos internos (`/...`, nunca `//...`): sem open redirect.
- Login, cadastro, logout e expiração trocam a sessão com `replaceSession`: remove todo o cache exceto a query de sessão (que o header observa) e grava a nova. O socket reconecta do zero quando o usuário muda (`useRealtime`), então eventos da sessão anterior não chegam ao novo usuário.
- `?reset` e `?scenario` são removidos da URL depois de aplicados, para não entrarem no `?redirect=`.

## 6. Estado do carrinho

- O carrinho vive no servidor (mock), por dono: `user:<id>` com token, `guest:<X-Guest-Id>` sem token; token inválido responde 401 em vez de cair no carrinho de visitante.
- Cada item guarda `priceSeen` (preço que o usuário viu). Se o preço atual diverge, a cotação acusa `PRICE_CHANGED`; esgotado e estoque menor viram `OUT_OF_STOCK`/`QUANTITY_REDUCED`. O pagamento fica bloqueado até "Atualizar carrinho" (`/cart/acknowledge`).
- O cupom também fica no carrinho do servidor (sobrevive ao refresh).
- No login, o carrinho de visitante é mesclado ao do usuário respeitando estoque e limite por pedido; o cupom vai junto se o usuário não tiver um.
- As mutations do carrinho usam `scope: { id: 'cart' }`: rodam em fila, e a resposta de uma nunca sobrescreve a da seguinte.

## 7. Estratégia de cache (TanStack Query)

- Chaves por recurso, parâmetros e usuário: `['nfts','list',params]`, `['cart', owner]`, `['quote', owner, network]`, `['order', userId, orderId]`, `['favorites', userId]`, `['wallets', userId]`. Usuário B nunca lê o cache do usuário A.
- `staleTime`: 30 s padrão; sessão 5 min; cotação 0 (sempre fresca).
- Retry: queries repetem até 2× exceto 4xx; mutations não repetem, **exceto a criação de pedido** (até 2× em `SERVICE_UNAVAILABLE`), que é segura porque reenvia a mesma `Idempotency-Key`.
- `keepPreviousData` na lista (sem piscar ao paginar/filtrar); `signal` repassado ao Axios (requisições canceladas ao trocar filtros).
- Invalidações após mutations (carrinho → cotações; pedido resolvido → carrinho, cotações e NFTs) e após eventos de tempo real.
- Favoritos com atualização otimista e rollback (toast) em erro.

## 8. Checkout e idempotência

- Uma `Idempotency-Key` por cotação: clique duplo, retry e reenvio usam a mesma chave; cotação nova gera chave nova.
- A tentativa é salva no `localStorage` **antes** do envio; após refresh, o app reenvia a mesma chave e recupera o pedido.
- O servidor responde a uma chave já usada **antes** de qualquer validação (com conflito se os dados diferem) e revalida tudo contra o estado atual (`QUOTE_OUTDATED` se preço, estoque, cupom ou taxa mudaram).
- O estoque é reservado ao criar o pedido (`pending`) e devolvido se o pagamento for recusado. A resolução é "preguiçosa": timer + qualquer leitura após o prazo, então funciona mesmo depois de recarregar.
- O recibo só aparece com `confirmed` vindo da simulação; o pedido é um snapshot (não muda se o catálogo mudar). Na confirmação, saem do carrinho só os itens e quantidades comprados.

## 9. Reconciliação REST × Socket.IO

- Versões: o cliente ignora evento com `version <= versão em cache` (nunca regride) e duplicado pelo `eventId` (conjunto limitado a 500 ids).
- Reconexão: ao reconectar, invalida com `refetchType: 'active'` NFTs, carrinho, cotações e pedidos — eventos podem ter sido perdidos enquanto estava desconectado. Um banner ("Conexão em tempo real perdida. Reconectando…") aparece enquanto isso.
- Pedido pendente: polling de 2 s como fallback; o `order.updated` acelera.
- `nft.updated` que afeta o carrinho invalida carrinho e cotação e avisa com toast só se o preço ou a disponibilidade realmente mudaram para o item.

## 10. Precisão de valores

ETH é sempre `string` no contrato e calculado com `decimal.js` (nunca `number`). O desconto do cupom é arredondado **para baixo** (`ROUND_DOWN`, 6 casas): nunca dá mais desconto do que o anunciado.

## 11. Decisões de UX e acessibilidade

- Skeletons com shimmer nas mesmas dimensões do conteúdo (CLS 0), sem animação com `prefers-reduced-motion`.
- Erros de campo associados (`aria-invalid` + `aria-describedby`), alertas com `role="alert"`, regiões `aria-live` para total, status de conexão e status do pedido.
- Estados que não dependem só de cor (ícone, texto, negrito, forma: "Esgotado", check na opção ativa, coração preenchido).
- Radios customizados são inputs nativos transparentes cobrindo o card (teclado, foco e clique no próprio controle); Sheets/Dialogs com foco preso e devolvido; skip link para `<main>`.
- Itens do Figma sem tela no escopo aparecem como texto "Em breve" (`aria-disabled`), nunca como link que não leva a lugar nenhum.
- "Adicionar ao carrinho" em vez de "Comprar": o fluxo exigido passa pelo carrinho. Sem barra de compra fixa no mobile, para não cobrir a navegação inferior.

## 12. Desvios do Figma e assets

- **Tema:** tokens medidos dos prints (fundo `#140d0a`, card `#241612`, primária `#d28a4c`), fonte Roboto Mono; só tema escuro (o design não tem claro).
- **Início:** filtros na lateral (desktop) e em Sheet (mobile) sem contagens por categoria nem "Rede" (sem dados); faixa de preço com campos mínimo/máximo em vez de slider; sem abas "Novos lançamentos/Em alta", coração no card do catálogo, banners e "Diário da Cunhagem"; destaque com legenda do NFT e carrossel sem autoplay.
- **Detalhe:** sem zoom, avaliações, atributos, compartilhar; edições mostram nome + tiragem (`Standard 1/50`); favorito só ícone.
- **Carrinho/Pagamento:** preço unitário sob o nome; "Ir para pagamento" em vez de "Conectar e finalizar"; campos do Figma sem contrato (ENS, indicação etc.) não existem; provedores (MetaMask/WalletConnect/Coinbase) substituídos por carteiras cadastradas + rede.
- **Recibo:** coluna "Carteira" virou "Rede" (o pedido só tem `walletId`); "Ver no explorador (simulado)"; data curta pt-BR.
- **Conta:** carteiras em lista + Dialog (o print mostra formulário inline); itens sem tela da barra lateral como "Em breve" (ocultos no mobile).
- **Mobile sem frame:** header mínimo (logo + menu em Sheet); barra inferior sem favoritos e sem o botão de escanear, com rótulos sob os ícones.
- **Assets:** imagens recortadas dos prints do Figma — 4 NFTs (`public/images/nfts/1-4.webp`, resolução nativa do recorte, 238–434 px) e 4 avatares (`public/images/creators/1-4.webp`, rostos dos mesmos personagens, 160 px). Não há arte original em alta resolução.

## 13. Limitações e próximos passos

- O MSW precisa iniciar o Service Worker antes da primeira renderização: no mobile o LCP fica em ~3,3 s (Performance 90–91). Com backend real, o app carregaria direto do HTML e caberiam SSR/streaming, CDN de imagens com `srcset`/AVIF e cache HTTP longo (análise completa em `lighthouse/SUMMARY.md`).
- Regressão visual roda em Linux (baselines do container); fora do Linux use `npm run test:e2e:docker`.
- Cada aba tem seu próprio "servidor" em memória; o tempo real não cruza abas/dispositivos.
- Com mais tempo: páginas "Mercado", "Criadores" e "Aprenda"; lista de pedidos e favoritos; upload de avatar para storage em vez de data URL; testes de contrato entre mock e API real; internacionalização.
