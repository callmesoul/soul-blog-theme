import { create } from 'zustand'
import type { Article, Category } from '@soul-blog/wc'
import { CATEGORIES, ARTICLES, ICONS } from '../data/mock-data'

interface ArticleState {
  articles: Article[]
  categories: Category[]
  icons: Record<string, string>
  activeCat: string
  activeTag: string
  tags: { name: string; count: number }[]
  catById: (id: string) => Category | undefined
  findArticle: (id: string) => Article | undefined
  resolveCat: (id: string) => string
  buildArticleHash: (artId: string, catId?: string) => string
  catNames: Record<string, string>
  setActiveCat: (cat: string) => void
  setActiveTag: (tag: string) => void
}

export const useArticles = create<ArticleState>((set, get) => {
  const catNames: Record<string, string> = {}
  CATEGORIES.forEach(c => { catNames[c.id] = c.name })

  // 收集所有标签及计数
  const tags: { name: string; count: number }[] = (() => {
    const map: Record<string, number> = {}
    ARTICLES.forEach(a => {
      if (a.tags) {
        a.tags.forEach(t => { map[t] = (map[t] || 0) + 1 })
      }
    })
    return Object.keys(map).sort().map(name => ({ name, count: map[name] }))
  })()

  return {
    articles: ARTICLES,
    categories: CATEGORIES,
    icons: ICONS,
    activeCat: 'all',
    activeTag: '',
    tags,
    catNames,
    catById: (id: string) => get().categories.find(c => c.id === id),
    findArticle: (id: string) => get().articles.find(a => a.id === id),
    resolveCat: (id: string) => {
      const cat = get().categories.find(c => c.id === id)
      return cat ? id : 'all'
    },
    buildArticleHash: (artId: string, catId?: string) => {
      const cat = catId ? `cat=${catId}` : ''
      return '#' + (cat ? `${cat}&` : '') + `art=${artId}`
    },
    setActiveCat: (cat: string) => set({ activeCat: cat }),
    setActiveTag: (tag: string) => set({ activeTag: tag })
  }
})