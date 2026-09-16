import { create } from 'zustand'
import type { AboutPageConfig, FriendsPageConfig, GiscusConfig, SocialItem } from '@soul-blog/wc'
import { loadSiteConfig, applySiteConfig, getSiteConfig, DEFAULT_FRIENDS_CONFIG, DEFAULT_SITE_CONFIG } from '../data/site-config'

interface SiteConfigState {
  siteName: string
  icp: string
  social: SocialItem[]
  about: AboutPageConfig
  friends: FriendsPageConfig
  giscus: GiscusConfig
  loaded: boolean
  load: () => Promise<void>
  apply: () => void
}

export const useSiteConfig = create<SiteConfigState>((set) => ({
  siteName: DEFAULT_SITE_CONFIG.site.name,
  icp: DEFAULT_SITE_CONFIG.site.icp,
  social: DEFAULT_SITE_CONFIG.social,
  about: DEFAULT_SITE_CONFIG.about,
  friends: DEFAULT_FRIENDS_CONFIG,
  giscus: DEFAULT_SITE_CONFIG.giscus,
  loaded: false,
  load: async () => {
    const cfg = await loadSiteConfig()
    set({
      siteName: cfg.site.name,
      icp: cfg.site.icp,
      social: cfg.social,
      about: cfg.about,
      friends: cfg.friends || DEFAULT_FRIENDS_CONFIG,
      giscus: cfg.giscus,
      loaded: true
    })
  },
  apply: () => {
    applySiteConfig(getSiteConfig())
  }
}))
