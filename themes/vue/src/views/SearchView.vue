<script setup lang="ts">
import { useArticleStore } from '../stores/articles'
import { useSiteConfigStore } from '../stores/site-config'
import { useRouter } from 'vue-router'
import SiteSidebar from '../components/SiteSidebar.vue'
import SearchResults from '../components/SearchResults.vue'

const articles = useArticleStore()
const siteConfig = useSiteConfigStore()
const router = useRouter()

function onResultSelect(id: string, cat: string) {
  router.push('/' + articles.buildArticleHash(id, cat))
}
</script>

<template>
  <SiteSidebar
    :categories="articles.categories"
    :social="siteConfig.social"
    :site-name="siteConfig.siteName"
    :icp="siteConfig.icp"
    active-cat="all"
  />

  <div class="flex min-w-0 flex-1 flex-col">
    <SearchResults
      :articles="articles.articles"
      :cat-names="articles.catNames"
      @result-select="onResultSelect"
    />
  </div>
</template>