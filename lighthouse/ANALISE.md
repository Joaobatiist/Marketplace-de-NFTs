## Análise

Todas as metas foram atingidas nas medianas. O ponto de atenção é a **Performance no mobile, exatamente no limite (90)**, com LCP de ~3,3 s; no desktop, 99 e LCP abaixo de 0,9 s. CLS é 0 nas quatro combinações (skeletons com as mesmas dimensões do conteúdo) e o TBT é baixo (≤ 29 ms).

### De onde vem o LCP no mobile

O LCP do mobile tem pouco "Load Time" (~70 ms) e muito "Load Delay" (~2,4 s): a imagem só começa a baixar depois de uma cadeia sequencial que é **própria da simulação com MSW**:

1. o HTML carrega o `index` e o chunk do MSW;
2. o Service Worker do MSW é registrado e ativado (`worker.start()`);
3. só então o app é importado (`import('./app')`) — obrigatório, porque o `socket.io-client` guarda `globalThis.WebSocket` ao ser avaliado e precisa pegar a versão já interceptada pelo MSW (ver ARCHITECTURE.md);
4. o app pede os dados (`/api/nfts`, `/api/nfts/featured`) com a latência do cenário padrão (250 ms);
5. as imagens são descobertas no HTML gerado e baixadas.

No mobile, a imagem do destaque fica pequena (128 px) e o elemento LCP passa a ser a imagem do 1º card do catálogo.

### O que foi otimizado

- `lang="pt-BR"`, `<title>`, `meta description`, `theme-color`, favicon e `robots.txt` (SEO 100).
- Fonte Roboto Mono via `@fontsource-variable` com `font-display: swap` e `<link rel="preload">` apenas do subset latino (injetado no build com o nome final do arquivo).
- Imagem do destaque com `fetchPriority="high"` e sem lazy; **cards da 1ª linha do catálogo sem lazy-load** (o LCP do mobile) — os demais com `loading="lazy"` e `decoding="async"`; todas com `width`/`height`.
- Code splitting por rota (`autoCodeSplitting`); painel de cenários e devtools com `lazy()` (as devtools nem entram no build de produção).
- Acessibilidade: contraste do botão "Filtros" no mobile (4,3:1 → ~7:1 com a cor primária cheia) e alvos de toque de 24×24 px nas bolinhas do carrossel.

### Experimento descartado

`<link rel="modulepreload">` para o chunk do app e suas dependências (para baixá-los em paralelo com o registro do Service Worker) **piorou** a Performance mobile para 78–79 (LCP 4,2 s): no 4G lento simulado, os 15 preloads disputam banda com o chunk do MSW, que é o caminho crítico. O experimento foi revertido.

### Com um backend real

Sem o Service Worker do MSW, os passos 2 e 3 desaparecem: o app seria carregado direto do HTML e os dados poderiam vir no primeiro render (SSR/streaming ou prefetch no servidor). Também caberiam CDN de imagens com `srcset`/AVIF, cache HTTP de longa duração para os assets com hash e `preconnect` ao domínio da API e do tempo real.
