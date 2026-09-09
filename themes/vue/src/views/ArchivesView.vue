<script setup lang="ts">
import { useArticleStore } from '../stores/articles'
import { useSiteConfigStore } from '../stores/site-config'
import { useRouter } from 'vue-router'
import SiteSidebar from '../components/SiteSidebar.vue'
import ArchiveList from '../components/ArchiveList.vue'

const articles = useArticleStore()
const siteConfig = useSiteConfigStore()
const router = useRouter()

// 侧栏分类/标签点击：回到首页应用对应筛选
function onNavigate(cat: string, tag?: string) {
  if (tag) {
    router.push({ path: '/', query: { tag } })
  } else {
    router.push({ path: '/', query: { cat } })
  }
}

// 归档行点击：跳回首页并打开对应文章阅读器
function onArticleSelect(id: string) {
  const art = articles.findArticle(id)
  if (!art) return
  router.push({ path: '/', query: { cat: art.cat, art: art.id } })
}
</script>

<template>
  <SiteSidebar
    :categories="articles.categories"
    :tags="articles.tags"
    :social="siteConfig.social"
    :site-name="siteConfig.siteName"
    :icp="siteConfig.icp"
    active-cat="archives"
    @navigate="onNavigate"
  />

  <div class="flex min-w-0 flex-1 flex-col">
    <ArchiveList
      :articles="articles.articles"
      :cat-names="articles.catNames"
      @article-select="onArticleSelect"
    />
  </div>
</template>
