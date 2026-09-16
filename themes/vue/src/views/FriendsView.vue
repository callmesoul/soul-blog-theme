<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useArticleStore } from '../stores/articles'
import { useSiteConfigStore } from '../stores/site-config'
import SiteSidebar from '../components/SiteSidebar.vue'

const router = useRouter()
const articles = useArticleStore()
const siteConfig = useSiteConfigStore()
const friendsRef = ref<HTMLElement>()

function applyFriendsConfig(): void {
  if (friendsRef.value) (friendsRef.value as any).config = siteConfig.friends
}

function onNavigate(cat: string, tag?: string): void {
  router.push({ path: '/', query: tag ? { tag } : { cat } })
}

onMounted(applyFriendsConfig)
watch(() => siteConfig.friends, applyFriendsConfig, { deep: true })
</script>

<template>
  <SiteSidebar
    :categories="articles.categories"
    :tags="articles.tags"
    :social="siteConfig.social"
    :site-name="siteConfig.siteName"
    :icp="siteConfig.icp"
    active-cat="friends"
    @navigate="onNavigate"
  />

  <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
    <friends-page ref="friendsRef"></friends-page>
  </div>
</template>
