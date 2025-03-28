import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { builtinModules } from 'module';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'out/renderer',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        ...builtinModules.flatMap(p => [p, `node:${p}`]),
      ],
      input: {
        index: resolve(__dirname, 'src/renderer/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      'assets': resolve(__dirname, 'src/renderer/assets'),
    },
  },
}); 