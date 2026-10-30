import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'
import { cpSync } from 'node:fs'

export default defineConfig({
  plugins: [tailwindcss(), {
    // 静态资源与 Hexo 主题同源（仓库根 assets/），构建时直拷贝到 Hugo 的 static/
    name: 'soul-hugo-default-assets',
    closeBundle () {
      for (const dir of ['images', 'audio']) {
        cpSync(resolve(__dirname, '../../assets', dir), resolve(__dirname, 'static', dir), { recursive: true })
      }
    },
  }],
  build: {
    outDir: 'static',
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
