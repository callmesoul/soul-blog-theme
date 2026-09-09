import { useRef, useEffect } from 'react'
import type { Article } from '@soul-blog/wc'

interface Props {
  articles: Article[]
  icons: Record<string, string>
  activeCat: string
  activeTag?: string
  onArticleSelect?: (id: string) => void
  onTagSelect?: (tag: string) => void
}

export default function ArticleList({ articles, icons, activeCat, activeTag, onArticleSelect, onTagSelect }: Props) {
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
    if (!el) return
    if (activeTag) el.setAttribute('active-tag', activeTag)
    else el.removeAttribute('active-tag')
  }, [activeTag])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const articleHandler = (e: Event) => onArticleSelect?.((e as CustomEvent).detail.id)
    const tagHandler = (e: Event) => onTagSelect?.((e as CustomEvent).detail.tag)
    el.addEventListener('article-select', articleHandler)
    el.addEventListener('tag-select', tagHandler)
    return () => {
      el.removeEventListener('article-select', articleHandler)
      el.removeEventListener('tag-select', tagHandler)
    }
  }, [onArticleSelect, onTagSelect])

  return <article-list ref={ref} active-cat="all"></article-list>
}