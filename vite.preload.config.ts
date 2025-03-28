import { defineConfig } from 'vite';
import { builtinModules } from 'module';

export default defineConfig({
  build: {
    outDir: 'out/preload',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        ...builtinModules.flatMap(p => [p, `node:${p}`]),
        'electron',
      ],
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
}); 