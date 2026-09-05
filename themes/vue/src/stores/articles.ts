import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Article, Category } from '@soul-blog/wc'
import { CATEGORIES, ARTICLES, ICONS } from '../data/mock-data'

export const useArticleStore = defineStore('articles', () => {
  const articles = ref<Article[]>(ARTICLES)
  const categories = ref<Category[]>(CATEGORIES)
  const icons = ref(ICONS)
  const activeCat = ref('all')

  function catById(id: string): Category | undefined {
    return categories.value.find(c => c.id === id)
  }

  function findArticle(id: string): Article | undefined {
    return articles.value.find(a => a.id === id)
  }

  function resolveCat(id: string): string {
    return catById(id) ? id : 'all'
  }

  function buildArticleHash(artId: string, catId?: string): string {
    const cat = catId ? `cat=${catId}` : ''
    return '#' + (cat ? `${cat}&` : '') + `art=${artId}`
  }

  const filteredArticles = computed(() => {
    if (activeCat.value === 'all') return articles.value
    return articles.value.filter(a => a.cat === activeCat.value)
  })

  const catNames = computed(() => {
    const names: Record<string, string> = {}
    categories.value.forEach(c => { names[c.id] = c.name })
    return names
  })

  return {
    articles, categories, icons, activeCat,
    catById, findArticle, resolveCat, buildArticleHash,
    filteredArticles, catNames
  }
})