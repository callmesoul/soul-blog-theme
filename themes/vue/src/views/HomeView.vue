<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
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

// 从 route query 中解析 cat 和 art
function getQueryCat(): string {
  return (route.query.cat as string) || 'all'
}
function getQueryArt(): string | null {
  return (route.query.art as string) || null
}
function getQueryTag(): string {
  return (route.query.tag as string) || ''
}

const currentCat = ref(getQueryCat())
const currentArtId = ref<string | null>(getQueryArt())
const currentTag = ref(getQueryTag())

// 标记：用户主动关闭阅读器，避免 watcher 重复触发 closeWithFlip 取消动画
let isClosingByUser = false

// 同步 route query 到状态
function onRouteUpdate() {
  currentCat.value = getQueryCat()
  currentArtId.value = getQueryArt()
  currentTag.value = getQueryTag()
  articles.setActiveTag(currentTag.value)
}

// 导航切换
function onNavigate(cat: string, tag?: string) {
  if (tag) {
    router.push({ query: { tag } })
  } else {
    router.push({ query: { cat } })
  }
}

// 标签选择（列表标签点击）
function onTagSelect(tag: string) {
  router.push({ query: { tag } })
}

// 文章选择（列表 → 阅读器）
function onArticleSelect(id: string) {
  const art = articles.findArticle(id)
  if (art) {
    router.push({ query: { cat: articles.resolveCat(currentCat.value), art: id } })
  }
}

// 阅读器内推荐点击
function onViewerArticleSelect(id: string, cat: string) {
  router.replace({ query: { cat: cat || articles.resolveCat(currentCat.value), art: id } })
  onRouteUpdate()
}

// 阅读器内标签点击：路由到 tag 列表（阅读器随 art 移除自动关闭）
function onViewerTagSelect(tag: string) {
  router.push({ query: { tag } })
}

// 阅读器关闭
function onViewerClose() {
  isClosingByUser = true
  // 阅读器关闭可能是「外部导航已把 art 移除」（如点击 tag / 推荐切文后）所致，
  // 此时 URL 已不再指向文章，无需再改写路由；
  // 仅当 URL 仍带 art（用户点 × / Esc / 遮罩主动关闭）才回落为纯分类列表。
  if (!route.query.art) return
  router.push({ query: { cat: articles.resolveCat(currentCat.value) } })
}

// 当前文章
const currentArticle = computed(() => {
  return currentArtId.value ? (articles.findArticle(currentArtId.value) ?? null) : null
})

function siteName(): string {
  return siteConfig.siteName || 'CallMeSoul'
}

onMounted(async () => {
  // 首页展示 Vercount 访问统计徽标
  document.body.classList.add('home-show-stat')
  // 初始路由
  if (currentArtId.value && currentArticle.value && viewerRef.value) {
    _openViewer(currentArtId.value)
  }
})

onUnmounted(() => {
  // 离开首页时隐藏访问统计徽标
  document.body.classList.remove('home-show-stat')
})

// 监听路由 query 参数变化
watch(() => route.query.cat, (val) => {
  currentCat.value = (val as string) || 'all'
})

watch(() => route.query.art, (val) => {
  currentArtId.value = (val as string) || null
})

watch(() => route.query.tag, (val) => {
  currentTag.value = (val as string) || ''
  articles.setActiveTag(currentTag.value)
})

// 监听 currentArtId 变化，打开/关闭阅读器
watch(currentArtId, (id) => {
  if (id && viewerRef.value) {
    isClosingByUser = false
    _openViewer(id)
  } else if (!id && viewerRef.value && !isClosingByUser) {
    viewerRef.value.closeWithFlip()
  }
}, { flush: 'post' })

function _openViewer(id: string) {
  const art = articles.findArticle(id)
  if (!art || !viewerRef.value) return
  // 直接设置 article 到 Web Component 上
  const viewerEl = document.querySelector('article-viewer') as any
  if (viewerEl) {
    viewerEl.article = art
    viewerEl.catNames = articles.catNames
  }
  const root = document.querySelector('article-list')?.shadowRoot || document
  const card = root.querySelector(`.article-card[data-id="${id}"]`)
  viewerRef.value.openWithFlip(card as HTMLElement, siteName())
}
</script>

<template>
  <SiteSidebar
    :categories="articles.categories"
    :tags="articles.tags"
    :social="siteConfig.social"
    :site-name="siteConfig.siteName"
    :icp="siteConfig.icp"
    :active-cat="currentCat"
    :active-tag="currentTag"
    @navigate="onNavigate"
  />

  <div class="relative flex min-w-0 flex-1 flex-col overflow-hidden">
	    <ArticleList
      :articles="articles.articles"
      :icons="articles.icons"
      :active-cat="currentCat"
      :active-tag="currentTag"
      @article-select="onArticleSelect"
      @tag-select="onTagSelect"
    />

	    <ArticleViewer
	      ref="viewerRef"
	      :article="currentArticle"
	      :articles="articles.articles"
	      :icons="articles.icons"
	      @article-select="onViewerArticleSelect"
	      @tag-select="onViewerTagSelect"
	      @viewer-close="onViewerClose"
    />
  </div>
</template>
