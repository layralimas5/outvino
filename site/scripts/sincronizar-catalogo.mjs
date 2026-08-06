/**
 * Puxa o catálogo da API do sistema e grava em `src/data/catalogo.json`.
 *
 * O site é estático: o JSON é a fonte do build. Depois de mexer em produto,
 * preço, banner ou vitrine no painel, roda isso e publica o site.
 *
 *   node scripts/sincronizar-catalogo.mjs
 *   API_URL=https://sistema.outvino.com.br node scripts/sincronizar-catalogo.mjs
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const API_URL = process.env.API_URL ?? 'http://localhost:3333';
const DESTINO = fileURLToPath(new URL('../src/data/catalogo.json', import.meta.url));

const resposta = await fetch(`${API_URL}/api/publico/catalogo`).catch((erro) => {
  console.error(`Não consegui falar com a API em ${API_URL}.`);
  console.error(erro.message);
  process.exit(1);
});

if (!resposta.ok) {
  console.error(`A API respondeu ${resposta.status} em ${API_URL}/api/publico/catalogo.`);
  process.exit(1);
}

const catalogo = await resposta.json();

if (!Array.isArray(catalogo.produtos)) {
  console.error('Resposta inesperada: faltou a lista de produtos.');
  process.exit(1);
}

// Sem produto o site vira uma loja vazia. Melhor abortar e manter o que havia.
if (catalogo.produtos.length === 0) {
  console.error('A API devolveu zero produtos publicados. Nada foi gravado.');
  process.exit(1);
}

await writeFile(DESTINO, `${JSON.stringify(catalogo, null, 2)}\n`, 'utf8');

console.log(
  `Catálogo atualizado: ${catalogo.produtos.length} produtos, ` +
    `${catalogo.banners.length} banners, ${catalogo.secoes.length} faixas.`,
);
