<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useSiteConfigStore } from './stores/site-config'
import { useArticleStore } from './stores/articles'
import { useRoute, useRouter } from 'vue-router'

const siteConfig = useSiteConfigStore()
const articles = useArticleStore()
const route = useRoute()
const router = useRouter()

/** 按当前路由设置页面 <title>（首页/归档/登录 各自维护，打开阅读器等由组件自行覆盖） */
function applyRouteTitle (): void {
  const site = siteConfig.siteName || 'CallMeSoul'
  const name = route.name
  if (name === 'login') {
    document.title = `登录 - ${site}`
  } else if (name === 'archives') {
    document.title = `归档 - ${site}`
  } else if (name === 'search') {
    document.title = `搜索 - ${site}`
  } else {
    document.title = `${site} - 首页`
  }
}

onMounted(async () => {
  await siteConfig.load()
  siteConfig.apply()

  const searchPanel = document.querySelector('search-panel') as any
  if (searchPanel) {
    searchPanel.articles = articles.articles
    searchPanel.addEventListener('search-select', (e: any) => {
      const { id, cat } = e.detail
      router.push({ query: { cat: cat || 'all', art: id } })
    })
  }
})

// 路由切换与站点名异步就绪时同步页面标题
watch(() => route.name, applyRouteTitle, { immediate: true })
watch(() => siteConfig.siteName, applyRouteTitle)

// 阅读器打开时组件会覆写 document.title 为文章标题；
// art 从 URL 移除（关闭阅读器 / 点击 tag 等）后统一还原为路由标题
watch(() => route.query.art, (val) => {
  if (!val) applyRouteTitle()
})
</script>

<template>
  <site-background image="/images/extracted/home/081a7f1fa54d497bc3afcaa85c41528c@2x.png"></site-background>

  <div class="relative z-10 flex min-h-0 flex-1 overflow-hidden">
    <router-view />
  </div>

  <music-player v-if="$route.name !== 'login'"></music-player>
  <search-panel></search-panel>
</template>

<style>
	*, *::before, *::after { box-sizing: border-box; }
	html, body { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; background: #080808; color: #fff; scrollbar-width: thin; scrollbar-color: #444 transparent; }
	#app { display: flex; flex-direction: column; flex: 1; min-height: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
    "Noto Sans SC", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  letter-spacing: 0.01em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
::selection { background: rgba(235, 79, 56, 0.3); }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #555; }
</style>