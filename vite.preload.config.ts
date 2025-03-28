import { defineConfig } from 'vite';
import { builtinModules } from 'module';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'out/preload',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/preload/index.ts'),
      formats: ['cjs'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: [
        ...builtinModules.flatMap(p => [p, `node:${p}`]),
        'electron',
      ],
    },
  },
}); 