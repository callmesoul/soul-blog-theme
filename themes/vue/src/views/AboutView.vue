<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useArticleStore } from '../stores/articles'
import { useSiteConfigStore } from '../stores/site-config'
import SiteSidebar from '../components/SiteSidebar.vue'

const router = useRouter()
const articles = useArticleStore()
const siteConfig = useSiteConfigStore()
const aboutRef = ref<HTMLElement>()

function applyAboutConfig(): void {
  if (aboutRef.value) (aboutRef.value as any).config = siteConfig.about
}

function onNavigate(cat: string, tag?: string): void {
  router.push({ path: '/', query: tag ? { tag } : { cat } })
}

onMounted(applyAboutConfig)
watch(() => siteConfig.about, applyAboutConfig, { deep: true })
</script>

<template>
  <SiteSidebar
    :categories="articles.categories"
    :tags="articles.tags"
    :social="siteConfig.social"
    :site-name="siteConfig.siteName"
    :icp="siteConfig.icp"
    active-cat="about"
    @navigate="onNavigate"
  />

  <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
    <about-page ref="aboutRef"></about-page>
  </div>
</template>
