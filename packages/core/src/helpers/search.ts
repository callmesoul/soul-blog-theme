import type { Article } from '../types'

/** 计算 query 对单段文本的模糊匹配得分 */
function fuzzyScore (query: string, text: string): number {
  const q = query.toLowerCase()
  const s = String(text || '').toLowerCase()
  if (!q || !s) return 0
  if (s === q) return 120
  if (s.startsWith(q)) return 100
  const idx = s.indexOf(q)
  if (idx >= 0) return 80 + Math.min(q.length, 10)
  // 子序列命中
  let qi = 0
  let score = 0
  let streak = 0
  for (let i = 0; i < s.length && qi < q.length; i++) {
    if (s[i] === q[qi]) {
      qi++
      streak++
      score += 1 + streak
    } else {
      streak = 0
    }
  }
  return qi < q.length ? 0 : score
}

export interface SearchResult {
  article: Article
  catName: string
  score: number
}

/**
 * 全量文章模糊搜索，按得分倒序
 * @param rawQuery 搜索关键词
 * @param articles 文章列表
 * @param catNames 目录名称映射 { catId: catName }
 * @param limit 最大返回条数（可选）
 */
export function searchArticles (
  rawQuery: string,
  articles: Article[],
  catNames: Record<string, string>,
  limit?: number
): SearchResult[] {
  const q = (rawQuery || '').trim()
  if (!q) return []
  const results: SearchResult[] = []
  for (const article of articles) {
    const catName = catNames[article.cat] || article.cat
    const fields = [
      { text: article.title, w: 5 },
      { text: article.summary, w: 3 },
      { text: catName, w: 3 },
      { text: (article.paragraphs || []).join(' '), w: 1 }
    ]
    let best = 0
    for (const item of fields) {
      const s = fuzzyScore(q, item.text) * item.w
      if (s > best) best = s
    }
    if (best > 0) results.push({ article, catName, score: best })
  }
  results.sort((a, b) => b.score - a.score)
  return limit ? results.slice(0, limit) : results
}