import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'
import { cpSync } from 'node:fs'

export default defineConfig({
  plugins: [tailwindcss(), {
    name: 'soul-hexo-default-assets',
    closeBundle () {
      for (const dir of ['images', 'audio']) {
        cpSync(resolve(__dirname, '../../assets', dir), resolve(__dirname, 'source', dir), { recursive: true })
      }
    },
  }],
  build: {
    outDir: 'source',
    emptyOutDir: true,
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
