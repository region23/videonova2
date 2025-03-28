import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
      '@components': path.resolve(__dirname, './src/components'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@main': path.resolve(__dirname, './electron/main'),
      '@preload': path.resolve(__dirname, './electron/preload'),
      '@common': path.resolve(__dirname, './electron/common'),
    }
  }
})
