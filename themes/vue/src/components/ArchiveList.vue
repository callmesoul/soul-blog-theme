<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { Article } from '@soul-blog/wc'

const props = withDefaults(defineProps<{
  articles: Article[]
  catNames?: Record<string, string>
}>(), {
  catNames: () => ({})
})

const emit = defineEmits<{
  articleSelect: [id: string]
}>()

const wcRef = ref<HTMLElement>()

function setData() {
  const el = wcRef.value
  if (!el) return
  ;(el as any).articles = props.articles
  ;(el as any).catNames = props.catNames
}

onMounted(setData)

watch(() => props.articles, (val) => {
  if (wcRef.value) (wcRef.value as any).articles = val
})

watch(() => props.catNames, (val) => {
  if (wcRef.value) (wcRef.value as any).catNames = val
})
</script>

<template>
  <archive-list
    ref="wcRef"
    :articles.prop="articles"
    :cat-names.prop="catNames"
    @article-select="emit('articleSelect', ($event as any).detail.id)"
  ></archive-list>
</template>
