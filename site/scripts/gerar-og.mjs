/**
 * Gera a imagem de compartilhamento (`public/og.png`, 1200x630).
 *
 * Roda sob demanda, não no build: a arte só muda quando a marca muda, e o PNG
 * fica versionado junto com o resto do site. Use `npm run og` depois de mexer
 * na paleta ou no wordmark.
 *
 * Desenha um SVG com as cores do design guide e converte com o `sharp` que já
 * vem no ninho de dependências do Astro. As fontes ficam em texto vetorizado
 * não: o SVG referencia a família por nome e o sharp usa a fonte do sistema;
 * por isso o layout evita depender de métrica exata (nada justificado, nada
 * colado na borda).
 */
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = resolve(RAIZ, 'public/og.png');

const LARGURA = 1200;
const ALTURA = 630;

const COR = {
  noite: '#0B0709',
  noiteClara: '#1B1418',
  creme: '#F6F1EA',
  cremeFraco: '#C9BFB4',
  ouro: '#D9B76A',
  vinho: '#8E1B31',
};

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGURA}" height="${ALTURA}" viewBox="0 0 ${LARGURA} ${ALTURA}">
  <defs>
    <radialGradient id="brilhoVinho" cx="26%" cy="18%" r="62%">
      <stop offset="0%" stop-color="${COR.vinho}" stop-opacity="0.55" />
      <stop offset="100%" stop-color="${COR.vinho}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="brilhoOuro" cx="88%" cy="82%" r="55%">
      <stop offset="0%" stop-color="${COR.ouro}" stop-opacity="0.22" />
      <stop offset="100%" stop-color="${COR.ouro}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="${LARGURA}" height="${ALTURA}" fill="${COR.noite}" />
  <rect width="${LARGURA}" height="${ALTURA}" fill="url(#brilhoVinho)" />
  <rect width="${LARGURA}" height="${ALTURA}" fill="url(#brilhoOuro)" />

  <g font-family="Georgia, 'Playfair Display', serif">
    <text x="90" y="200" font-size="42" fill="${COR.ouro}">O</text>
    <text x="119" y="200" font-size="36" fill="${COR.creme}">utvino</text>

    <text x="90" y="330" font-size="76" fill="${COR.creme}">Vinho bom não</text>
    <text x="90" y="410" font-size="76" fill="${COR.creme}">precisa de ocasião</text>
  </g>

  <g font-family="Inter, 'Segoe UI', Arial, sans-serif">
    <text x="90" y="470" font-size="28" fill="${COR.cremeFraco}">
      Curadoria garrafa por garrafa. Pedido fechado no WhatsApp.
    </text>
  </g>

  <rect x="90" y="524" width="180" height="4" rx="2" fill="${COR.ouro}" />

  <g font-family="Inter, 'Segoe UI', Arial, sans-serif">
    <text x="90" y="580" font-size="20" fill="${COR.cremeFraco}" letter-spacing="3">
      VENDA PROIBIDA PARA MENORES DE 18 ANOS
    </text>
  </g>

  <rect y="${ALTURA - 8}" width="${LARGURA}" height="8" fill="${COR.noiteClara}" />
</svg>`;

await mkdir(dirname(DESTINO), { recursive: true });
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(DESTINO);

console.log(`og.png gerado em ${DESTINO}`);
