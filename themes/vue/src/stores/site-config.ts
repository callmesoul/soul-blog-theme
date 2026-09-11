import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AboutPageConfig, GiscusConfig, SocialItem } from '@soul-blog/wc'
import { loadSiteConfig, applySiteConfig, getSiteConfig, DEFAULT_SITE_CONFIG } from '../data/site-config'

export const useSiteConfigStore = defineStore('site-config', () => {
  const siteName = ref(DEFAULT_SITE_CONFIG.site.name)
  const icp = ref(DEFAULT_SITE_CONFIG.site.icp)
  const social = ref<SocialItem[]>(DEFAULT_SITE_CONFIG.social)
  const about = ref<AboutPageConfig>(DEFAULT_SITE_CONFIG.about)
  const giscus = ref<GiscusConfig>(DEFAULT_SITE_CONFIG.giscus)
  const loaded = ref(false)

  async function load() {
    const cfg = await loadSiteConfig()
    siteName.value = cfg.site.name
    icp.value = cfg.site.icp
    social.value = cfg.social
    about.value = cfg.about
    giscus.value = cfg.giscus
    loaded.value = true
  }

  function apply() {
    applySiteConfig(getSiteConfig())
  }

  return { siteName, icp, social, about, giscus, loaded, load, apply }
})
