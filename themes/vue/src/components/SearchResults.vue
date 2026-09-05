<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { Article } from '@soul-blog/wc'

const props = defineProps<{
  articles: Article[]
  catNames: Record<string, string>
}>()

const emit = defineEmits<{
  resultSelect: [id: string, cat: string]
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
  <search-results
    ref="wcRef"
    v-bind="{ articles, catNames }"
    @result-select="emit('resultSelect', ($event as any).detail.id, ($event as any).detail.cat)"
  ></search-results>
</template>