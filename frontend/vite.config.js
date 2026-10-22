import process from 'node:process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Mismo proxy en dev y en preview (npm run demo); los hosts del túnel rápido de Cloudflare se permiten en ambos.
// BECORE_API_PROXY solo lo usa scripts/demo.mjs cuando el backend corre en otro puerto (DEMO_API_PORT)
const proxy = { '/api': process.env.BECORE_API_PROXY || 'http://localhost:3000' };
const allowedHosts = ['.trycloudflare.com'];

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // MapLibre (mapa vectorial, P6) va en un chunk diferido de ~1033 kB que solo se descarga al abrir un mapa.
    // El límite sube lo justo para ese chunk: cualquier otro que pase de 1050 kB sigue avisando.
    chunkSizeWarningLimit: 1050,
  },
  server: {
    host: true,
    port: 5173,
    proxy,
    allowedHosts,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
    proxy,
    allowedHosts,
  },
});
