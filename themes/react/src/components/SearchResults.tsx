import { useRef, useEffect } from 'react'
import type { Article } from '@soul-blog/wc'

interface Props {
  articles: Article[]
  catNames: Record<string, string>
  onResultSelect?: (id: string, cat: string) => void
}

export default function SearchResults({ articles, catNames, onResultSelect }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    ;(el as any).articles = articles
    ;(el as any).catNames = catNames
  }, [articles, catNames])

  useEffect(() => {
    const el = ref.current
    if (!el || !onResultSelect) return
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail
      onResultSelect(d.id, d.cat)
    }
    el.addEventListener('result-select', handler)
    return () => el.removeEventListener('result-select', handler)
  }, [onResultSelect])

  return <search-results ref={ref}></search-results>
}