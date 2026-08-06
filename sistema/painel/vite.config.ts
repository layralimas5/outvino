import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    /**
     * O painel chama `/api/...` no próprio host e o Vite repassa pra API.
     * Assim não existe URL de backend espalhada pelo código nem CORS em dev.
     */
    proxy: {
      '/api': { target: 'http://localhost:3333', changeOrigin: true },
    },
  },
});
