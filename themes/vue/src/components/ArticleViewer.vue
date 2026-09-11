<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { Article, GiscusConfig } from '@soul-blog/wc'

const props = defineProps<{
  article: Article | null
  articles: Article[]
  icons: Record<string, string>
  giscus: GiscusConfig
}>()

const emit = defineEmits<{
  articleSelect: [id: string, cat: string]
  tagSelect: [tag: string]
  viewerClose: []
}>()

const wcRef = ref<HTMLElement>()

function openWithFlip(cardEl: HTMLElement | null, siteName: string) {
  if (wcRef.value) {
    (wcRef.value as any).openWithFlip(cardEl, siteName)
  }
}

function closeWithFlip() {
  if (wcRef.value) {
    (wcRef.value as any).closeWithFlip()
  }
}

// 阅读器内标签点击：preventDefault 表示已由 vue-router 接管，
// 组件将不再自行关闭阅读器/改写 location.hash
function onWcTagSelect(value: unknown) {
  const event = value as CustomEvent<{ tag?: string }>
  event.preventDefault()
  if (event.detail?.tag) emit('tagSelect', event.detail.tag)
}

function setData() {
  const el = wcRef.value
  if (!el) return
  ;(el as any).article = props.article
  ;(el as any).articles = props.articles
  ;(el as any).icons = props.icons
  ;(el as any).giscusConfig = props.giscus
}

onMounted(setData)

watch(() => props.article, (val) => {
  if (wcRef.value) (wcRef.value as any).article = val
})

watch(() => props.articles, (val) => {
  if (wcRef.value) (wcRef.value as any).articles = val
})

watch(() => props.icons, (val) => {
  if (wcRef.value) (wcRef.value as any).icons = val
})

watch(() => props.giscus, (val) => {
  if (wcRef.value) (wcRef.value as any).giscusConfig = val
}, { deep: true })

defineExpose({ openWithFlip, closeWithFlip })
</script>

<template>
  <article-viewer
    ref="wcRef"
    v-bind="{ article, articles, icons, giscus }"
    @article-select="emit('articleSelect', ($event as any).detail.id, ($event as any).detail.cat)"
    @tag-select="onWcTagSelect"
    @viewer-close="emit('viewerClose')"
  >
    <span slot="page-views" id="vercount_value_page_pv" aria-label="本文阅读量">—</span>
  </article-viewer>
</template>
