<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { Article } from '@soul-blog/wc'

const props = defineProps<{
  articles: Article[]
  icons: Record<string, string>
  activeCat: string
}>()

const emit = defineEmits<{
  articleSelect: [id: string]
}>()

const wcRef = ref<HTMLElement>()

function setData() {
  const el = wcRef.value
  if (!el) return
  el.setAttribute('active-cat', props.activeCat)
  ;(el as any).articles = props.articles
  ;(el as any).icons = props.icons
}

onMounted(setData)

watch(() => props.activeCat, (val) => {
  wcRef.value?.setAttribute('active-cat', val)
})

watch(() => props.articles, (val) => {
  if (wcRef.value) (wcRef.value as any).articles = val
})

watch(() => props.icons, (val) => {
  if (wcRef.value) (wcRef.value as any).icons = val
})
</script>

<template>
  <article-list
    ref="wcRef"
    v-bind="{ articles, icons }"
    :active-cat="activeCat"
    @article-select="emit('articleSelect', ($event as any).detail.id)"
  ></article-list>
</template>