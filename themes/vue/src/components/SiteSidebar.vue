<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { Category, SocialItem } from '@soul-blog/wc'

const props = withDefaults(defineProps<{
  categories: Category[]
  tags?: { name: string; count: number }[]
  social: SocialItem[]
  siteName: string
  icp: string
  activeCat: string
  activeTag?: string
  /** 归档页地址（默认 Vue hash 路由），设为 '' 可隐藏归档导航 */
  archiveUrl?: string
  /** 关于页地址（默认 Vue hash 路由），设为 '' 可隐藏关于导航 */
  aboutUrl?: string
  /** 友链页地址（默认 Vue hash 路由），设为 '' 可隐藏友链导航 */
  friendsUrl?: string
}>(), {
  tags: () => [],
  archiveUrl: '#/archives',
  aboutUrl: '#/about',
  friendsUrl: '#/friends'
})

const emit = defineEmits<{
  navigate: [cat: string, tag?: string]
}>()

const wcRef = ref<HTMLElement>()

function setData() {
  const el = wcRef.value
  if (!el) return
  ;(el as any).categories = props.categories
  ;(el as any).tags = props.tags
  ;(el as any).social = props.social
  ;(el as any).siteName = props.siteName
  ;(el as any).icp = props.icp
  ;(el as any).archiveUrl = props.archiveUrl
  ;(el as any).aboutUrl = props.aboutUrl
  ;(el as any).friendsUrl = props.friendsUrl
  el.setAttribute('active-cat', props.activeCat)
  if (props.activeTag) el.setAttribute('active-tag', props.activeTag)
}

onMounted(setData)

watch(() => props.activeCat, (val) => {
  wcRef.value?.setAttribute('active-cat', val)
})

watch(() => props.activeTag, (val) => {
  if (wcRef.value) {
    if (val) wcRef.value.setAttribute('active-tag', val)
    else wcRef.value.removeAttribute('active-tag')
  }
})

watch(() => props.archiveUrl, (val) => {
  if (wcRef.value) (wcRef.value as any).archiveUrl = val
})

watch(() => props.aboutUrl, (val) => {
  if (wcRef.value) (wcRef.value as any).aboutUrl = val
})

watch(() => props.friendsUrl, (val) => {
  if (wcRef.value) (wcRef.value as any).friendsUrl = val
})

watch(() => props.categories, (val) => {
  if (wcRef.value) (wcRef.value as any).categories = val
})

watch(() => props.tags, (val) => {
  if (wcRef.value) (wcRef.value as any).tags = val
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
    @navigate="emit('navigate', ($event as any).detail.cat, ($event as any).detail.tag)"
  ></site-sidebar>
</template>
