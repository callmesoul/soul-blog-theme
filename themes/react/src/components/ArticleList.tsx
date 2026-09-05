import { useRef, useEffect } from 'react'
import type { Article } from '@soul-blog/wc'

interface Props {
  articles: Article[]
  icons: Record<string, string>
  activeCat: string
  onArticleSelect?: (id: string) => void
}

export default function ArticleList({ articles, icons, activeCat, onArticleSelect }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    ;(el as any).articles = articles
    ;(el as any).icons = icons
  }, [articles, icons])

  useEffect(() => {
    ref.current?.setAttribute('active-cat', activeCat)
  }, [activeCat])

  useEffect(() => {
    const el = ref.current
    if (!el || !onArticleSelect) return
    const handler = (e: Event) => onArticleSelect((e as CustomEvent).detail.id)
    el.addEventListener('article-select', handler)
    return () => el.removeEventListener('article-select', handler)
  }, [onArticleSelect])

  return <article-list ref={ref} active-cat="all"></article-list>
}