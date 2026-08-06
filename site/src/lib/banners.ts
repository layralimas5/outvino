/**
 * Resolve as versões leves geradas por `npm run banners`.
 *
 * O caminho que chega aqui pode vir de dois lugares: da arte que a Outvino
 * coloca em `public/banners/` ou do campo `imagem` de um banner cadastrado no
 * painel, que pode apontar pra qualquer URL. Só o primeiro caso tem WebP ao
 * lado; o segundo é usado como veio.
 */
const LARGURAS = [1600, 900, 480] as const;

/** Largura mais estreita, boa o bastante pros fundos desfocados. */
export const LARGURA_DE_FUNDO = LARGURAS[LARGURAS.length - 1];

const OTIMIZAVEL = /^\/banners\/(.+)\.(png|jpe?g)$/i;

export interface FontesDeBanner {
  /** `srcset` em WebP, do maior pro menor. */
  srcset: string;
  /** Versão estreita e única, pros fundos que entram borrados. */
  fundo: string;
  /** Arte original, que segue como fallback dentro do `<picture>`. */
  original: string;
}

export function fontesDoBanner(caminho: string): FontesDeBanner | null {
  const nome = OTIMIZAVEL.exec(caminho)?.[1];
  if (nome === undefined) return null;

  return {
    srcset: LARGURAS.map((largura) => `/banners/${nome}-${largura}.webp ${largura}w`).join(', '),
    fundo: `/banners/${nome}-${LARGURA_DE_FUNDO}.webp`,
    original: caminho,
  };
}
