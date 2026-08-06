/**
 * Resolve as versões normalizadas geradas por `npm run produtos`.
 *
 * Mesma ideia do `banners.ts`: o campo `imagem` do produto pode vir de dois
 * lugares. Da foto que a Outvino larga em `public/produtos/`, e aí o script já
 * gravou os dois WebP quadrados e arquivou o original fora do build, ou de uma
 * URL qualquer cadastrada no painel, que é usada como veio — e aí esta função
 * devolve `null` e a marcação serve a imagem crua.
 *
 * Os dois tamanhos existem porque o cartão da vitrine desenha a foto com uns
 * 150px de lado no celular e a página do rótulo com quase 400px: servir o de
 * 600 para os dois seria carregar quatro vezes mais pixel do que aparece.
 */
const LARGURAS = [600, 300] as const;

/** Tamanho que entra como `src`, para quem ignora o `srcset`. */
const LARGURA_PADRAO = LARGURAS[0];

/** O `imagem` do produto aponta para o WebP grande: `/produtos/<id>-600.webp`. */
const NORMALIZADA = new RegExp(`^/produtos/(.+)-${LARGURA_PADRAO}\\.webp$`, 'i');

export interface FontesDaFoto {
  /** `srcset` em WebP, do maior para o menor. */
  srcset: string;
  /** Versão única, para o `src` do `<img>`. */
  padrao: string;
}

export function fontesDaFoto(caminho: string): FontesDaFoto | null {
  const nome = NORMALIZADA.exec(caminho)?.[1];
  if (nome === undefined) return null;

  return {
    srcset: LARGURAS.map((largura) => `/produtos/${nome}-${largura}.webp ${largura}w`).join(', '),
    padrao: `/produtos/${nome}-${LARGURA_PADRAO}.webp`,
  };
}
