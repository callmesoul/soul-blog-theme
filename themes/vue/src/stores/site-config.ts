import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SiteConfig, SocialItem } from '@soul-blog/wc'
import { loadSiteConfig, applySiteConfig, getSiteConfig, DEFAULT_SITE_CONFIG } from '../data/site-config'

export const useSiteConfigStore = defineStore('site-config', () => {
  const siteName = ref(DEFAULT_SITE_CONFIG.site.name)
  const icp = ref(DEFAULT_SITE_CONFIG.site.icp)
  const social = ref<SocialItem[]>(DEFAULT_SITE_CONFIG.social)
  const loaded = ref(false)

  async function load() {
    const cfg = await loadSiteConfig()
    siteName.value = cfg.site.name
    icp.value = cfg.site.icp
    social.value = cfg.social
    loaded.value = true
  }

  function apply() {
    applySiteConfig(getSiteConfig())
  }

  return { siteName, icp, social, loaded, load, apply }
})