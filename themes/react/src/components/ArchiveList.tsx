import { useRef, useEffect } from 'react'
import type { Article } from '@soul-blog/wc'

interface Props {
  articles: Article[]
  catNames: Record<string, string>
  onArticleSelect?: (id: string) => void
}

export default function ArchiveList({ articles, catNames, onArticleSelect }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    ;(el as any).articles = articles
    ;(el as any).catNames = catNames
  }, [articles, catNames])

  useEffect(() => {
    const el = ref.current
    if (!el || !onArticleSelect) return
    const handler = (e: Event) => onArticleSelect((e as CustomEvent).detail.id)
    el.addEventListener('article-select', handler)
    return () => el.removeEventListener('article-select', handler)
  }, [onArticleSelect])

  return <archive-list ref={ref}></archive-list>
}
