import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Article, Category } from '@soul-blog/wc'
import { CATEGORIES, ARTICLES, ICONS } from '../data/mock-data'

export const useArticleStore = defineStore('articles', () => {
  const articles = ref<Article[]>(ARTICLES)
  const categories = ref<Category[]>(CATEGORIES.map(c => ({
    ...c,
    count: ARTICLES.filter(a => a.cat === c.id).length
  })))
  const icons = ref(ICONS)
  const activeCat = ref('all')
  const activeTag = ref('')

  // 收集所有标签及计数
  const tags = computed(() => {
    const map: Record<string, number> = {}
    articles.value.forEach(a => {
      if (a.tags) {
        a.tags.forEach(t => { map[t] = (map[t] || 0) + 1 })
      }
    })
    return Object.keys(map).sort().map(name => ({ name, count: map[name] }))
  })

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
    let filtered = activeCat.value === 'all'
      ? articles.value
      : articles.value.filter(a => a.cat === activeCat.value)
    if (activeTag.value) {
      filtered = filtered.filter(a => a.tags && a.tags.includes(activeTag.value))
    }
    return filtered
  })

  const catNames = computed(() => {
    const names: Record<string, string> = {}
    categories.value.forEach(c => { names[c.id] = c.name })
    return names
  })

  function setActiveTag(tag: string) {
    activeTag.value = tag
  }

  return {
    articles, categories, icons, activeCat, activeTag, tags,
    catById, findArticle, resolveCat, buildArticleHash,
    filteredArticles, catNames, setActiveTag
  }
})