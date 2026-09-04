import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'

export default defineConfig({
  plugins: [
    tailwindcss(),
    svgLoader({
      defaultImport: 'url'
    }),
  ],
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
