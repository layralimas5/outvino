/**
 * Configuração central do site. Tudo que muda por cliente/ambiente vive aqui.
 *
 * ⚠️ Os campos marcados com TODO são placeholders. Confirmar com a Outvino
 * antes de publicar: WhatsApp errado é pedido perdido.
 */
export const SITE = {
  name: 'Outvino',
  /** TODO: trocar pelo domínio real. */
  url: 'https://outvino.com.br',
  shortDescription: 'Vinhos escolhidos garrafa por garrafa. Peça pelo WhatsApp.',
  description:
    'Adega com curadoria de tintos, brancos, rosés e espumantes de 6 países. Escolha no site, feche o pedido pelo WhatsApp e receba em casa.',
  locale: 'pt-BR',
  /** TODO: número real da loja, formato internacional, só dígitos. */
  whatsapp: '5527999999999',
  /** TODO: confirmar endereço e horários. */
  address: {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'BR',
  },
  openingHours: 'Todo dia, das 10h às 22h',
  /** TODO: confirmar perfil. */
  instagram: 'https://www.instagram.com/outvino/',
  /**
   * Identificação do fornecedor exigida pelo Decreto 7.962/2013 nas páginas
   * institucionais.
   *
   * TODO: pedir razão social, CNPJ e e-mail à Outvino. Enquanto estiverem
   * vazios, o bloco de identificação simplesmente não é renderizado: melhor
   * faltar do que publicar dado inventado.
   */
  empresa: {
    razaoSocial: '',
    cnpj: '',
    email: '',
  },
} as const;

/**
 * Arte da marca usada no banner da home e no fundo dos cartões vinho.
 *
 * Fica aqui e não no catálogo porque `npm run sync` reescreve o
 * `catalogo.json` inteiro a cada sincronização: um banner cadastrado no painel
 * com imagem própria continua tendo prioridade, e esta entra quando não houver.
 * Depois de trocar o arquivo, rodar `npm run banners`.
 */
export const BANNER_PADRAO = '/banners/banner-site.png';

export const NAV_LINKS = [
  { href: '/vinhos/', label: 'Vinhos' },
  { href: '/simule/', label: 'Simule' },
  { href: '/adega/', label: 'A adega' },
  { href: '/contato/', label: 'Contato' },
] as const;

/**
 * Navegação do rodapé. É o menu do topo mais o que saiu de lá.
 *
 * "Sobre nós" não é mais aba, mas a página continua existindo e precisa de
 * link em algum lugar: página que só o sitemap conhece o Google trata como
 * órfã, e quem quiser saber quem está por trás da loja não teria como chegar.
 */
export const RODAPE_LINKS = [...NAV_LINKS, { href: '/sobre/', label: 'Sobre nós' }] as const;

/**
 * Endereço do back-office.
 *
 * O sistema é outro projeto na Netlify — por isso entra como URL absoluta e
 * não como rota do site. Em desenvolvimento aponta pro Vite do painel; pra
 * apontar pra outro lugar sem editar código, defina `PUBLIC_SISTEMA_URL`.
 *
 * Quando a Outvino tiver domínio próprio, é aqui (ou na variável) que o
 * endereço muda.
 */
export const SISTEMA_URL =
  import.meta.env.PUBLIC_SISTEMA_URL ??
  (import.meta.env.DEV ? 'http://localhost:5173/' : 'https://outvino-sistema.netlify.app/');

/** Atalhos em ícone, à direita do menu. */
export const NAV_ACOES = [
  { href: '/rastreio/', icone: 'rastreio', rotulo: 'Rastrear pedido', externo: false },
  { href: '/conta/', icone: 'usuario', rotulo: 'Minha conta', externo: false },
  /** Atalho da loja pro próprio sistema. Abre em outra aba: é outro endereço. */
  { href: SISTEMA_URL, icone: 'sistema', rotulo: 'Painel do Admin', externo: true },
] as const;

/**
 * Endereço da API do sistema e chave do carrinho.
 *
 * A chave viaja no bundle. É barreira contra bot, não segredo: com ela só dá
 * pra criar pedido em rascunho, que ninguém atende sem a loja confirmar.
 * Sem as duas variáveis, o carrinho continua funcionando e manda o pedido
 * direto pro WhatsApp, sem registrar no sistema.
 */
export const API = {
  url: import.meta.env.PUBLIC_API_URL ?? '',
  chave: import.meta.env.PUBLIC_CHAVE_SITE ?? '',
} as const;
