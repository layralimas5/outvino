# Briefing — Outvino

**Data:** 30/07/2026
**Tipo:** cliente
**Entrega:** site ecommerce + sistema de gestão

## Decisões fechadas

| Tema | Decisão |
| --- | --- |
| Checkout | Carrinho → WhatsApp. Pedido grava no sistema como rascunho e abre o WhatsApp com o resumo. Sem gateway por enquanto. |
| Stack | Astro no site, painel React/Vite/Tailwind, API Express serverless + Netlify Blobs (mesmo padrão do Reis dos Vinhos). |
| Gestão (MVP) | Produtos + estoque, pedidos, vitrine/banners, cupons e relatórios. |
| Catálogo | Não existe ainda. Site sobe com seed de exemplo; produtos reais entram pelo painel. |

## A confirmar com o cliente

- [ ] Nome fantasia completo e como assina (Outvino? Outvino Adega?)
- [ ] Número de WhatsApp da loja
- [ ] Endereço, cidade e horário de funcionamento
- [ ] Domínio
- [ ] Instagram e demais redes
- [ ] Faz entrega? Região atendida e política de frete
- [ ] Logo em vetor (ou aprovar o wordmark que está no ar)
- [ ] Fotos dos produtos (fundo, proporção)
- [ ] Razão social, CNPJ e e-mail — o Decreto 7.962/2013 exige identificação do
      fornecedor nas páginas legais; enquanto não vierem, o bloco não é publicado
- [ ] Revisar os textos de privacidade, termos e trocas (foram escritos a partir
      do CDC e da LGPD, mas o cliente precisa concordar com o que promete)

## Fase 2 (fora do MVP)

- Pagamento online (Mercado Pago: Pix, cartão, boleto) com webhook de confirmação
- Cálculo de frete por CEP
- Login de cliente e histórico de pedidos
- ~~Autenticação no painel~~ — feito: senha única (`SENHA_PAINEL`) + sessão em
  cookie assinado. Falta usuário por pessoa e permissão por papel.
