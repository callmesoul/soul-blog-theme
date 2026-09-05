import { create } from 'zustand'
import type { Article, Category } from '@soul-blog/wc'
import { CATEGORIES, ARTICLES, ICONS } from '../data/mock-data'

interface ArticleState {
  articles: Article[]
  categories: Category[]
  icons: Record<string, string>
  activeCat: string
  catById: (id: string) => Category | undefined
  findArticle: (id: string) => Article | undefined
  resolveCat: (id: string) => string
  buildArticleHash: (artId: string, catId?: string) => string
  catNames: Record<string, string>
  setActiveCat: (cat: string) => void
}

export const useArticles = create<ArticleState>((set, get) => {
  const catNames: Record<string, string> = {}
  CATEGORIES.forEach(c => { catNames[c.id] = c.name })

  return {
    articles: ARTICLES,
    categories: CATEGORIES,
    icons: ICONS,
    activeCat: 'all',
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
    setActiveCat: (cat: string) => set({ activeCat: cat })
  }
})