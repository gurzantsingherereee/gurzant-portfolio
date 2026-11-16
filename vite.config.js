import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  server: { port: 5173, host: true, open: false },
  build: {
    outDir: 'dist',
    minify: 'terser',
    rollupOptions: {
      input: { portfolio: resolve(import.meta.dirname, 'index.html'), dashboard: resolve(import.meta.dirname, 'admin.html') }
    }
  }
});