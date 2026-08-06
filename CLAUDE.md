# Outvino — ecommerce de vinhos + sistema de gestão

> Projeto criado em 30/07/2026. Pasta dedicada — o que está aqui sobrescreve as
> regras da raiz quando houver conflito.

## Sobre

Loja de vinhos online (vitrine, catálogo, página de produto, carrinho) com um
back-office próprio pra gerir produtos, estoque, pedidos, vitrine, cupons e
relatórios.

**Checkout:** o carrinho não cobra no site. Ao finalizar, o pedido é gravado no
sistema como rascunho e o cliente é levado pro WhatsApp com o resumo já pronto.
A loja confirma no painel e só aí o estoque baixa.

## Estrutura

```
site/       loja pública — Astro + React (ilhas) + Tailwind
sistema/    back-office — API Express (serverless na Netlify) + painel React/Vite
  api/      regra de negócio, clean architecture
  painel/   SPA de gestão
identidade/ design guide da marca
dados/      material bruto do cliente (planilha, fotos)
```

## Deploy

Repositório: <https://github.com/layralimas5/outvino>. **Dois** projetos Netlify
apontam pro mesmo repositório, cada um com um *base directory* diferente. Sem
esse ajuste a Netlify olha pra raiz, não acha nada pra publicar e todo caminho
responde o 404 dela (o genérico, não a página 404 da loja — é assim que se
reconhece esse erro).

| Projeto | Base directory | Publica | Endereço |
| --- | --- | --- | --- |
| Loja | `site` | `dist` | <https://outvino.netlify.app> |
| Sistema | `sistema` | `painel/dist` | *(ainda não criado)* |

O resto (comando de build, redirects, headers) vem do `netlify.toml` de cada
pasta — o arquivo manda sobre o que estiver na interface.

⚠️ **Não preencher "package directory" (`package_path`)** junto com o base: a
Netlify soma os dois e vai procurar em `site/site/`, o build parece passar e o
deploy sai vazio.

⚠️ O projeto do sistema só deve ser criado **depois** de definir `SENHA_PAINEL`
nas variáveis de ambiente dele. Sem ela em produção, as rotas de gestão
respondem 503 de propósito e o painel sobe fechado.

## Regras do projeto

- Dinheiro **sempre em centavos** (inteiro) dentro da API. Converte pra reais só
  na borda (resposta HTTP e catálogo do site).
- `id` de produto é slug e vira URL — **não muda** depois de publicado.
- Estoque só muda por movimento registrado. Nunca por edição direta do produto.
- Produto que já apareceu em pedido não é excluído: despublica.
- O site é estático. O catálogo vem de `site/src/data/*.json`, sincronizado da
  API por `npm run sync` — depois de mexer em produto no painel, rodar o sync e
  publicar o site.
- O acesso ao painel depende de `SENHA_PAINEL` (mínimo 12 caracteres):
  - **vazia em desenvolvimento** (é como está hoje, a pedido da Lay): o painel
    abre direto, sem login e sem nome. O histórico de estoque e pedido fica
    assinado como `Sistema`, que é o autor padrão da API;
  - **preenchida**: volta a tela de login com nome e senha. A sessão é um
    cookie `httpOnly` assinado, dura `SESSAO_HORAS` (12 por padrão), e trocar a
    senha derruba todas as sessões abertas;
  - **vazia em produção**: as rotas de gestão respondem 503 de propósito e o
    painel mostra o aviso do que configurar — sistema fechado é melhor do que
    back-office aberto na internet. Ou seja, **antes de publicar o sistema a
    senha precisa existir nas variáveis da Netlify.**
- Nada de avaliação/nota inventada em produto. Só entra o que for real.
- Texto legal nunca inventa dado do cliente. O bloco de identificação do
  fornecedor nas páginas institucionais só aparece quando `SITE.empresa` estiver
  preenchido — faltar é melhor do que publicar CNPJ falso.
- A imagem de compartilhamento é gerada por `npm run og` (script + sharp) e fica
  versionada em `site/public/og.png`. Rodar de novo só quando a marca mudar.
- Arte de banner entra em `site/public/banners/`. Depois de colocar ou trocar
  o arquivo, rodar `npm run banners`: o script gera os WebP de 1600, 900 e 480px
  ao lado do original (o PNG do cliente tem megabytes e o banner é o LCP da
  home). O caminho da arte padrão fica em `BANNER_PADRAO`, no `site.ts`, porque
  `npm run sync` reescreve o `catalogo.json` inteiro.
- Foto de produto entra em `site/public/produtos/`, **um arquivo por rótulo,
  com o nome do produto** (fundo branco, packshot). Depois, rodar
  `npm run produtos`: o script renomeia o arquivo para o `id` do produto,
  recorta o branco em volta e reencaixa tudo num quadrado de margem fixa,
  gerando `<id>-600.webp` e `<id>-300.webp`. É isso que mantém garrafa alta,
  garrafa baixa e caixa de kit do mesmo tamanho dentro do cartão — nenhum
  ajuste de CSS por produto. Arquivo cujo nome não bate com nenhum `id` é
  ignorado com aviso, e produto sem foto continua com a ilustração de garrafa.
  O campo `imagem` aponta para o original (`/produtos/<id>.png`); quem resolve
  os WebP é `fontesDaFoto()`, e toda foto é desenhada pelo `FotoDoProduto`.

## Estado atual

- Catálogo real ainda não existe: o site roda com seed de exemplo em
  `sistema/api/dados/`. Trocar pelos produtos do cliente quando chegarem.
- Dados do negócio (WhatsApp, endereço, domínio, redes, razão social, CNPJ,
  e-mail) são placeholders em `site/src/config/site.ts` — marcados com `TODO`.
  Confirmar antes de publicar.
- O site tem 26 páginas e passa em `astro check` sem erro. Já estão no ar:
  home, catálogo com filtro, página de produto, simulador, adega/FAQ, sobre,
  contato, rastreio, conta (placeholder consciente), 404, privacidade, termos
  e trocas e devoluções.
- As 14 fotos de produto já estão normalizadas e ligadas ao catálogo (e à
  seed da API, para o `npm run sync` não perder o campo `imagem`).
- `/simule/` é o simulador: cinco perguntas de um lado (ocasião, comida,
  paladar, experiência, orçamento) e a vitrine se reordenando do outro a cada
  resposta. As regras vivem em `site/src/lib/simulador.ts`, puras e sem React —
  a ilha só desenha. Toda regra lê campo que já existe no catálogo, nunca
  inventa característica de vinho, e orçamento é limite (empurra para o fim da
  lista com aviso), não pontuação. Para calibrar a indicação, mexer nas regras
  do lib, não no componente.
- O filtro do catálogo é lateral, estilo ecommerce: grupos com múltipla
  escolha, contagem por opção recalculada como facet (o próprio grupo sai da
  conta), etiquetas do que está ativo, estado na URL e gaveta no celular.
- Página interna abre com o `CapaDePagina`: faixa escura de sangria total com
  a arte da marca desfocada ao fundo. Quem usa precisa passar `headerSobreposto`
  no `BaseLayout`, senão sobra uma barra branca em cima da arte. O mesmo fundo,
  em versão cartão, é o `BlocoVinho` — usado nos blocos de chamada ("Ficou com
  dúvida?", "Antes de chamar", convites da home).
- FAQ é o componente `Perguntas`: `<details>`/`<summary>` nativo com seta que
  gira. Sem JavaScript de propósito — abre, fecha, navega por teclado e anuncia
  estado sozinho. A primeira pergunta nasce aberta.
- "Sobre nós" saiu do menu do topo a pedido do cliente. A página continua
  existindo e é linkada no rodapé por `RODAPE_LINKS` (`site.ts`): página órfã
  o Google desconta, e ninguém chegaria nela.
- `devToolbar` desligado no `astro.config.mjs`: a barra do Astro só aparecia em
  `npm run dev`, mas confundia na hora de revisar layout.
- Portão de idade 18+ no `BaseLayout`: script inline no `<head>` grava
  `data-portao` antes da primeira pintura, então não pisca. Sem JavaScript ele
  não aparece e o site segue navegável (falha aberto, de propósito).
- O painel tem login (senha única + sessão em cookie). Falta ainda usuário por
  pessoa e permissão por papel — hoje quem entra faz tudo. O nome informado no
  login é o que assina o histórico de estoque e pedido.
- O painel tem onze telas, agrupadas na barra lateral vinho por momento de uso:
  **Operação** (Resumo, Pedidos, Produtos, Estoque), **Loja** (Vitrine, Cupons,
  Avaliações), **Gestão** (Financeiro, CRM) e **Sistema** (API, Configuração).
  Na barra de topo ficam o sino e o botão de conta.
- O sino não inventa notificação: lista o que está parado esperando alguém
  (pedido do site sem confirmar, avaliação sem moderar, produto no estoque
  mínimo), tudo vindo de `GET /api/relatorios/resumo` numa chamada só.
- **Financeiro** (`GET /api/relatorios/financeiro`) fecha o período com
  faturamento, custo, margem e ranking por rótulo. Duas honestidades que a tela
  deixa à vista: o custo é o **cadastrado hoje** (o pedido não guarda custo
  histórico), e rascunho não é receita — aparece como pipeline, à parte. Venda
  de produto sem custo cadastrado é contada e avisada, senão a margem mente.
- **CRM** (`GET /api/clientes`) é montado a partir dos pedidos, agrupando por
  telefone: não existe cadastro de cliente no sistema, e criar um agora seria
  inventar dado. Quem só tem rascunho aparece marcado como lead, não cliente.
- **API** e **Configuração** são telas de leitura. A de Configuração mostra o
  que está valendo no servidor a partir de `GET /api/diagnostico`, que responde
  apenas **se** cada variável está definida — nenhuma senha, chave ou token
  atravessa. Nada ali é editável de propósito: o sistema não deve poder
  afrouxar a própria segurança com um clique.
- A rota do painel para a tela de API é `/integracao`, não `/api`: esse prefixo
  é do servidor (o proxy do Vite em dev e a própria API em produção respondem
  antes do painel), então a tela nunca abriria.

## Antes de publicar

- [ ] Preencher `SITE.whatsapp`, `SITE.url`, `SITE.address`, `SITE.instagram` e
      `SITE.empresa` em `site/src/config/site.ts`
- [ ] Revisar as três páginas legais com o cliente (prazo de entrega e política
      de frete ainda não estão escritos porque a loja não fechou os números)
- [ ] Trocar o seed pelos produtos reais e rodar `npm run sync`
- [ ] Definir `SENHA_PAINEL` (e opcionalmente `SEGREDO_SESSAO`) nas variáveis de
      ambiente do projeto Netlify do sistema — sem isso o painel sobe fechado

## Contexto que herda da raiz

Tom de voz, marca e contexto do negócio vêm de `_memoria/` e `identidade/` da
raiz. Regras de desenvolvimento (TypeScript strict, clean code, mobile-first,
a11y, Conventional Commits) valem aqui integralmente.
