import { create } from 'zustand'
import type { AboutPageConfig, SocialItem } from '@soul-blog/wc'
import { loadSiteConfig, applySiteConfig, getSiteConfig, DEFAULT_SITE_CONFIG } from '../data/site-config'

interface SiteConfigState {
  siteName: string
  icp: string
  social: SocialItem[]
  about: AboutPageConfig
  loaded: boolean
  load: () => Promise<void>
  apply: () => void
}

export const useSiteConfig = create<SiteConfigState>((set) => ({
  siteName: DEFAULT_SITE_CONFIG.site.name,
  icp: DEFAULT_SITE_CONFIG.site.icp,
  social: DEFAULT_SITE_CONFIG.social,
  about: DEFAULT_SITE_CONFIG.about,
  loaded: false,
  load: async () => {
    const cfg = await loadSiteConfig()
    set({ siteName: cfg.site.name, icp: cfg.site.icp, social: cfg.social, about: cfg.about, loaded: true })
  },
  apply: () => {
    applySiteConfig(getSiteConfig())
  }
}))
