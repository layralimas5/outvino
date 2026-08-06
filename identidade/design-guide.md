# Identidade — Outvino

> Proposta inicial, feita sem material de marca do cliente. Se vier logo ou
> paleta oficial, essa página é a primeira a mudar.

## Conceito

Vinho sem cerimônia. Página clara e editorial, produto em destaque, e a adega
escura aparecendo só onde ela conta uma história: o banner do topo e o rodapé.
Nada de brasão, pergaminho ou cacho de uva desenhado.

## Paleta

Tema **claro**: fundo branco, tinta escura, vinho como acento. Os tons de noite
ficam reservados ao banner estendido e ao rodapé. Os tokens vivem em
`site/src/styles/global.css`.

### Papel e tinta (o site inteiro)

| Token | Hex | Uso |
| --- | --- | --- |
| `papel-0` | `#FFFFFF` | Fundo da página e superfície de card |
| `papel-50` | `#FAF8F6` | Faixa de destaque, campo de formulário |
| `papel-100` | `#F3EFE9` | Divisória leve, botão desabilitado |
| `papel-200` | `#E6E0D7` | Borda padrão de card e input |
| `papel-300` | `#D3CABD` | Borda em hover, contorno de botão secundário |
| `tinta-900` | `#171114` | Título e texto forte |
| `tinta-700` | `#4B4147` | Corpo de texto |
| `tinta-500` | `#7C7178` | Texto auxiliar, label, breadcrumb |
| `vinho-600` | `#8E1B31` | CTA, preço, link e eyebrow |
| `vinho-700` | `#6F1426` | Hover do CTA |

### Noite (só banner e rodapé)

| Token | Hex | Uso |
| --- | --- | --- |
| `noite-950` | `#0B0709` | Fundo do banner estendido e do rodapé |
| `noite-900` | `#120D10` | Bloco escuro dentro do fluxo claro |
| `noite-800` | `#1B1418` | Divisória dentro do escuro |
| `noite-700` | `#2A2026` | Borda dentro do escuro |
| `creme-100` | `#F6F1EA` | Texto principal sobre noite |
| `creme-300` | `#C9BFB4` | Texto secundário sobre noite |
| `creme-500` | `#9A9088` | Texto auxiliar sobre noite |
| `ouro-400` | `#D9B76A` | Eyebrow e detalhe sobre noite |
| `ouro-500` | `#C19D4F` | Contorno de badge "novo" |
| `ouro-700` | `#8A6A1F` | Ouro escurecido pra virar texto sobre branco |

Contraste: `tinta-700` sobre branco passa AA com folga, `tinta-500` passa AA em
texto normal e `vinho-600` sobre branco passa AA. **Ouro claro nunca vira texto
sobre branco** — sobre papel ele só existe como `ouro-700` ou como contorno.

A classe `.no-escuro` inverte o contexto: aplicada num bloco de fundo noite, ela
faz título virar creme e eyebrow virar ouro sem repintar cada elemento na mão.

## Tipografia

- **Display:** Playfair Display Variable — títulos, nome de produto, preço grande.
- **Texto:** Inter Variable — corpo, interface, tabelas.
- Título com `letter-spacing: -0.02em`. Nada de caixa alta em bloco de texto;
  caixa alta só em eyebrow/label, com `tracking` largo.

## Raio de canto

Nada de canto reto. A escala é curta de propósito:

- `rounded-2xl` (16px) — card, painel e bloco de destaque
- `rounded-lg` (8px) — botão, input e select
- `rounded-full` — badge, pílula de filtro e botão de ícone do header

## Componentes

- **Card de produto:** fundo branco, borda `papel-200`, cantos `rounded-2xl`,
  nome em display, preço em `vinho-600`. Hover levanta 2px, escurece a borda e
  acende uma sombra baixa.
- **Botão primário:** fundo `vinho-600`, texto creme, `rounded-lg`.
- **Botão secundário:** contorno `papel-300`, texto tinta.
- **Botão sobre noite:** fundo `creme-100`, texto `noite-950`.
- **Badge de promoção:** fundo `vinho-600`, texto creme, `rounded-full`.
- **Bloco vinho** (`BlocoVinho.astro`): superfície `rounded-2xl` de fundo
  `vinho-700` com dois borrões desfocados por cima (um `vinho-600`, um
  `noite-950`), texto e CTA em creme. É a peça de cor cheia no meio do fluxo
  claro. Na home ele aparece duas vezes — a chamada da promoção, acima da faixa
  "Em promoção", e o convite do fim da página. Nunca dois em seguida: precisa
  de conteúdo claro entre um e outro pra não virar parede.
- **Botão de ícone (header):** círculo de 40px, fundo transparente, hover em
  branco 15% sobre o banner e tinta 6% depois do scroll.

## Header

Duas formas, decididas pelo prop `sobreposto` do `Header.astro`:

1. **Sobre banner** (home): `fixed`, sem cor nenhuma, texto creme por cima do
   banner. Passando de 24px de scroll ganha fundo branco a 85% com
   `backdrop-blur-xl` e o texto vira tinta.
2. **Página normal:** `sticky`, já nasce sólido e não muda.

A ordem é logo à esquerda, links no meio (Vinhos, A adega, Sobre nós, Contato) e
três ícones à direita: rastreio, usuário e carrinho. Nenhum texto de botão ali,
só ícone com `aria-label`.

## Movimento

Sutil e curto (150–300ms, `cubic-bezier(0.22, 1, 0.36, 1)`). Fade + 8px de
subida na entrada de seção. Tudo desligado sob `prefers-reduced-motion`.

## Logo

Wordmark em Playfair Display: **Outvino**, com o "O" levemente maior — ouro
sobre o banner escuro, vinho depois que o header fica sólido. Enquanto não
houver logo oficial, é o que o site usa no header e no footer.
