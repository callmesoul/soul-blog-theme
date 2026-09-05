<script setup lang="ts">
import { onMounted } from 'vue'
import { useSiteConfigStore } from './stores/site-config'

const siteConfig = useSiteConfigStore()

onMounted(async () => {
  await siteConfig.load()
  siteConfig.apply()
})
</script>

<template>
  <site-background image="/images/extracted/home/081a7f1fa54d497bc3afcaa85c41528c@2x.png"></site-background>

  <div class="relative z-10 flex min-h-0 flex-1 overflow-hidden">
    <router-view />
  </div>

  <music-player v-if="$route.name !== 'login'"></music-player>
  <search-panel></search-panel>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; }
html, body { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; background: #080808; color: #fff; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
    "Noto Sans SC", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  letter-spacing: 0.01em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
::selection { background: rgba(235, 79, 56, 0.3); }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
</style>