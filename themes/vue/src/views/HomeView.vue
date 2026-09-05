<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArticleStore } from '../stores/articles'
import { useSiteConfigStore } from '../stores/site-config'
import SiteSidebar from '../components/SiteSidebar.vue'
import ArticleList from '../components/ArticleList.vue'
import ArticleViewer from '../components/ArticleViewer.vue'

const route = useRoute()
const router = useRouter()
const articles = useArticleStore()
const siteConfig = useSiteConfigStore()

const viewerRef = ref<InstanceType<typeof ArticleViewer>>()

// 从 hash 中解析 cat 和 art
function getHashCat(): string {
  const m = location.hash.match(/[#&]cat=([\w-]+)/)
  return m ? decodeURIComponent(m[1]) : 'all'
}
function getHashArt(): string | null {
  const m = location.hash.match(/[#&]art=([\w-]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

const currentCat = ref(getHashCat())
const currentArtId = ref<string | null>(getHashArt())

// 同步 hash 到状态
function onHashChange() {
  currentCat.value = getHashCat()
  currentArtId.value = getHashArt()
}

// 导航切换
function onNavigate(cat: string) {
  router.push({ hash: `#cat=${encodeURIComponent(cat)}` })
}

// 文章选择（列表 → 阅读器）
function onArticleSelect(id: string) {
  const art = articles.findArticle(id)
  if (art) {
    router.push({ hash: articles.buildArticleHash(id, articles.resolveCat(currentCat.value)) })
  }
}

// 阅读器内推荐点击
function onViewerArticleSelect(id: string, cat: string) {
  router.replace({ hash: articles.buildArticleHash(id, cat || articles.resolveCat(currentCat.value)) })
}

// 阅读器关闭
function onViewerClose() {
  router.push({ hash: `#cat=${encodeURIComponent(articles.resolveCat(currentCat.value))}` })
}

// 当前文章
const currentArticle = computed(() => {
  return currentArtId.value ? (articles.findArticle(currentArtId.value) ?? null) : null
})

function siteName(): string {
  return siteConfig.siteName || 'CallMeSoul'
}

onMounted(async () => {
  window.addEventListener('hashchange', onHashChange)
  // 初始路由
  if (currentArtId.value && currentArticle.value && viewerRef.value) {
    const card = document.querySelector(`.article-card[data-id="${currentArtId.value}"]`)
    viewerRef.value.openWithFlip(card as HTMLElement, siteName())
  }
})

onUnmounted(() => {
  window.removeEventListener('hashchange', onHashChange)
})
</script>

<template>
  <SiteSidebar
    :categories="articles.categories"
    :social="siteConfig.social"
    :site-name="siteConfig.siteName"
    :icp="siteConfig.icp"
    :active-cat="currentCat"
    @navigate="onNavigate"
  />

  <div class="flex min-w-0 flex-1 flex-col">
    <ArticleList
      :articles="articles.articles"
      :icons="articles.icons"
      :active-cat="currentCat"
      @article-select="onArticleSelect"
    />

    <ArticleViewer
      ref="viewerRef"
      :article="currentArticle"
      :articles="articles.articles"
      :icons="articles.icons"
      @article-select="onViewerArticleSelect"
      @viewer-close="onViewerClose"
    />
  </div>
</template>