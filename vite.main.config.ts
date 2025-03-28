import { defineConfig } from 'vite';
import { builtinModules } from 'module';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'out/main',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/main/index.ts'),
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