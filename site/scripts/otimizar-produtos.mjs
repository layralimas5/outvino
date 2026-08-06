/**
 * Normaliza as fotos de produto.
 *
 * A foto que chega do fornecedor vem em tamanho e enquadramento livres: uma
 * garrafa em retrato de 1024x1536, um kit em quadrado de 1254x1254, cada uma
 * com uma sobra de branco diferente em volta. Jogadas cruas no cartão, uma
 * garrafa aparece maior que a vizinha e a vitrine fica torta.
 *
 * O script resolve isso em quatro passos, para cada arte:
 *
 *   1. confere que o nome do arquivo bate com um `id` do catálogo;
 *   2. recorta o branco em volta, de modo que o que sobra é só a garrafa;
 *   3. reencaixa dentro de um quadrado branco de margem fixa e grava os WebP;
 *   4. arquiva o original fora de `public/`.
 *
 * O passo 4 é o que segura o peso do site: o PNG do fornecedor tem cerca de um
 * megabyte, o WebP equivalente tem onze kilobytes, e o original não é servido
 * em lugar nenhum. Ele continua aqui como fonte, em `site/fotos/`, para dar
 * para gerar de novo com outra margem ou outro tamanho quando precisar.
 *
 * Uso: solta as fotos em `public/produtos/`, com o nome do rótulo, e roda
 *
 *   npm run produtos
 */
import { mkdir, readdir, rename } from 'node:fs/promises';
import { basename, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import catalogo from '../src/data/catalogo.json' with { type: 'json' };

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Onde as fotos novas são largadas e onde os WebP ficam. */
const PUBLICA = resolve(RAIZ, 'public/produtos');
/** Onde os originais são guardados depois de processados. Fora do build. */
const ARQUIVO = resolve(RAIZ, 'fotos');

/** As mesmas larguras que `fontesDaFoto()` monta no `srcset`. */
const LARGURAS = [600, 300];

/**
 * Quanto do quadrado sobra de branco em volta da garrafa.
 *
 * 8% de cada lado: perto o bastante da borda para a garrafa continuar sendo o
 * assunto do cartão, longe o bastante para o gargalo não encostar no arredondado.
 */
const MARGEM = 0.08;

/** Tolerância do recorte de branco. Alta o bastante para pegar a sombra suave
 *  do estúdio, baixa o bastante para não comer o rótulo claro da garrafa. */
const TOLERANCIA_DE_BRANCO = 12;

const BRANCO = { r: 255, g: 255, b: 255 };

const ORIGINAIS = new Set(['.png', '.jpg', '.jpeg']);

/** Mesma regra de slug que a API usa para virar `id` — e, por tabela, URL. */
function slug(texto) {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const idsDoCatalogo = new Set(catalogo.produtos.map((produto) => produto.id));

await mkdir(ARQUIVO, { recursive: true });

/** Fotos a processar: as recém-largadas em `public/` e as já arquivadas. */
const pastas = [PUBLICA, ARQUIVO];
const artes = [];

for (const pasta of pastas) {
  for (const arquivo of await readdir(pasta)) {
    if (ORIGINAIS.has(extname(arquivo).toLowerCase())) artes.push({ pasta, arquivo });
  }
}

if (artes.length === 0) {
  console.log(`Nenhuma foto em ${PUBLICA}. Coloque os PNG ou JPG dos produtos lá e rode de novo.`);
}

const semProduto = [];
const comFoto = new Set();

for (const { pasta, arquivo } of artes) {
  const extensao = extname(arquivo).toLowerCase();
  const id = slug(basename(arquivo, extname(arquivo)));

  if (!idsDoCatalogo.has(id)) {
    semProduto.push(arquivo);
    continue;
  }

  comFoto.add(id);

  const origem = resolve(pasta, arquivo);

  /**
   * O `trim` devolve a garrafa sem a sobra de branco. Vem antes do `resize`
   * porque é ele que iguala o enquadramento: sem isso, uma foto com 300px de
   * respiro e outra com 40px continuariam desiguais dentro do mesmo quadrado.
   */
  const recortada = await sharp(origem)
    .flatten({ background: BRANCO })
    .trim({ background: BRANCO, threshold: TOLERANCIA_DE_BRANCO })
    .toBuffer();

  for (const lado of LARGURAS) {
    const util = Math.round(lado * (1 - 2 * MARGEM));

    const { size } = await sharp(recortada)
      .resize({ width: util, height: util, fit: 'contain', background: BRANCO })
      .resize({ width: lado, height: lado, fit: 'contain', background: BRANCO })
      .webp({ quality: 82 })
      .toFile(resolve(PUBLICA, `${id}-${lado}.webp`));

    console.log(`${id}-${lado}.webp: ${Math.round(size / 1024)} kB`);
  }

  // Sai de `public/` para não ser publicado, e ganha o nome do produto.
  await rename(origem, resolve(ARQUIVO, `${id}${extensao}`));
}

for (const arte of semProduto) {
  console.warn(`Ignorada: "${arte}" não bate com nenhum id do catálogo.`);
}

const semFoto = [...idsDoCatalogo].filter((id) => !comFoto.has(id));
if (semFoto.length > 0) {
  console.warn(`Sem foto (segue com a ilustração de garrafa): ${semFoto.join(', ')}`);
}
