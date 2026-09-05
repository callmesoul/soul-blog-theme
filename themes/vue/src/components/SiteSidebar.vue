<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { Category, SocialItem } from '@soul-blog/wc'

const props = defineProps<{
  categories: Category[]
  social: SocialItem[]
  siteName: string
  icp: string
  activeCat: string
}>()

const emit = defineEmits<{
  navigate: [cat: string]
}>()

const wcRef = ref<HTMLElement>()

function setData() {
  const el = wcRef.value
  if (!el) return
  ;(el as any).categories = props.categories
  ;(el as any).social = props.social
  ;(el as any).siteName = props.siteName
  ;(el as any).icp = props.icp
  el.setAttribute('active-cat', props.activeCat)
}

onMounted(setData)

watch(() => props.activeCat, (val) => {
  wcRef.value?.setAttribute('active-cat', val)
})

watch(() => props.categories, (val) => {
  if (wcRef.value) (wcRef.value as any).categories = val
})

watch(() => props.social, (val) => {
  if (wcRef.value) (wcRef.value as any).social = val
})

watch(() => props.siteName, (val) => {
  if (wcRef.value) (wcRef.value as any).siteName = val
})

watch(() => props.icp, (val) => {
  if (wcRef.value) (wcRef.value as any).icp = val
})
</script>

<template>
  <site-sidebar
    ref="wcRef"
    v-bind="{ categories, social, siteName, icp }"
    :active-cat="activeCat"
    @navigate="emit('navigate', ($event as any).detail.cat)"
  ></site-sidebar>
</template>