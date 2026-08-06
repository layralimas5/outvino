/**
 * Gera as versões leves dos banners de `public/banners/`.
 *
 * O arquivo que o cliente entrega costuma ser um PNG de vários megabytes, e o
 * banner da home é justamente o LCP da página: servir o original derrubaria a
 * métrica no celular. Para cada arte, o script grava três WebP de largura fixa
 * (1600, 900 e 480) ao lado do original, com o mesmo nome mais o sufixo da
 * largura.
 *
 * O 480 existe para os cartões de fundo desfocado: como a imagem entra borrada,
 * nenhum detalhe se perde e o download vira alguns kilobytes.
 *
 * Roda sob demanda, igual ao `npm run og`: `npm run banners` depois de colocar
 * (ou trocar) uma arte na pasta. Os WebP ficam versionados junto com o site.
 */
import { readdir } from 'node:fs/promises';
import { basename, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const PASTA = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public/banners');

/** As mesmas larguras que `fontesDoBanner()` monta no `srcset`. */
const LARGURAS = [1600, 900, 480];

const ORIGINAIS = new Set(['.png', '.jpg', '.jpeg']);

const arquivos = await readdir(PASTA);
const artes = arquivos.filter((arquivo) => ORIGINAIS.has(extname(arquivo).toLowerCase()));

if (artes.length === 0) {
  console.log(`Nenhuma arte em ${PASTA}. Coloque o PNG ou JPG do banner lá e rode de novo.`);
}

for (const arte of artes) {
  const nome = basename(arte, extname(arte));

  for (const largura of LARGURAS) {
    const destino = resolve(PASTA, `${nome}-${largura}.webp`);

    // `withoutEnlargement` evita esticar uma arte menor que a largura pedida.
    const { size } = await sharp(resolve(PASTA, arte))
      .resize({ width: largura, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(destino);

    console.log(`${nome}-${largura}.webp: ${Math.round(size / 1024)} kB`);
  }
}
