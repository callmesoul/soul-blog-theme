import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import dts from 'vite-plugin-dts'
import { fileURLToPath, URL } from 'node:url'

// 组件库构建配置：build.lib 打库 + vite-plugin-dts 生成 .d.ts
// 阶段 0 仅产出类型契约 + 设计令牌；组件入口随阶段 1 补齐。
export default defineConfig({
  plugins: [
    tailwindcss(),
    dts({ include: ['src'], exclude: ['src/**/*.test.ts'] })
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'SoulBlogWc',
      formats: ['es'],
      fileName: 'index'
    },
    sourcemap: true,
    rollupOptions: {
      // Web Components 组件库暂无运行时外部依赖
      external: []
    }
  }
})