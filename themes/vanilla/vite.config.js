import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    tailwindcss(),
    svgLoader({
      defaultImport: 'url'
    }),
  ],
  publicDir: resolve(__dirname, '../../assets'),
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        login: 'login.html',
        search: 'search.html',
      }
    }
  }
})
