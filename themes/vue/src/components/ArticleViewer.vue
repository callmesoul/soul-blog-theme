<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { Article } from '@soul-blog/wc'

const props = defineProps<{
  article: Article | null
  articles: Article[]
  icons: Record<string, string>
}>()

const emit = defineEmits<{
  articleSelect: [id: string, cat: string]
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

function setData() {
  const el = wcRef.value
  if (!el) return
  ;(el as any).article = props.article
  ;(el as any).articles = props.articles
  ;(el as any).icons = props.icons
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

defineExpose({ openWithFlip, closeWithFlip })
</script>

<template>
  <article-viewer
    ref="wcRef"
    v-bind="{ article, articles, icons }"
    @article-select="emit('articleSelect', ($event as any).detail.id, ($event as any).detail.cat)"
    @viewer-close="emit('viewerClose')"
  ></article-viewer>
</template>