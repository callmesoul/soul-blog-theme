import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { resolve, dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 将 @soul-blog/wc 的所有 Web Components 标记为自定义元素
          isCustomElement: tag => tag.startsWith('site-')
            || tag.startsWith('article-')
            || tag.startsWith('search-')
            || tag.startsWith('music-')
            || tag.startsWith('login-')
        }
      }
    }),
    tailwindcss(),
  ],
  publicDir: resolve(__dirname, '../../assets'),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})