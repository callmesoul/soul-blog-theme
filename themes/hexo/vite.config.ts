import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: 'source',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: 'js/[name].js',
        assetFileNames: 'css/[name][extname]',
      },
    },
  },
})