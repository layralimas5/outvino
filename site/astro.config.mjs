// @ts-check
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { SITE } from './src/config/site.ts';

export default defineConfig({
  site: SITE.url,
  integrations: [react(), sitemap()],
  /**
   * A barra flutuante do Astro no canto inferior aparece só em `npm run dev`
   * (nunca no site publicado), mas atrapalha revisar layout e assusta quem vê
   * o site rodando local achando que é elemento da página. Desligada.
   */
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
    /**
     * Cache do Vite fora da pasta do projeto.
     *
     * Esse repositório vive dentro do OneDrive, e o sync segura o handle de
     * `node_modules/.vite/deps` justo quando o Vite renomeia a pasta na
     * otimização de dependências. O resultado é um `EBUSY: resource busy or
     * locked` que derruba o `astro check` ou trava o dev server em "transport
     * invoke timed out after 60000ms", devolvendo 500 na primeira página.
     *
     * Em pasta temporária o OneDrive não olha, e o cache é descartável por
     * definição: apagar só custa uma otimização a mais.
     */
    cacheDir: join(tmpdir(), 'vite-outvino-site'),
  },
});
