import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import type { Article } from '@soul-blog/wc'

interface Props {
  article: Article | null
  articles: Article[]
  icons: Record<string, string>
  onArticleSelect?: (id: string, cat: string) => void
  onViewerClose?: () => void
}

export interface ArticleViewerHandle {
  openWithFlip: (cardEl: HTMLElement | null, siteName: string) => void
  closeWithFlip: () => void
}

const ArticleViewer = forwardRef<ArticleViewerHandle, Props>(
  function ArticleViewer({ article, articles, icons, onArticleSelect, onViewerClose }, ref) {
    const wcRef = useRef<HTMLElement>(null)

    useImperativeHandle(ref, () => ({
      openWithFlip(cardEl: HTMLElement | null, siteName: string) {
        if (wcRef.current) {
          ;(wcRef.current as any).openWithFlip(cardEl, siteName)
        }
      },
      closeWithFlip() {
        if (wcRef.current) {
          ;(wcRef.current as any).closeWithFlip()
        }
      }
    }))

    useEffect(() => {
      const el = wcRef.current
      if (!el) return
      ;(el as any).article = article
    }, [article])

    useEffect(() => {
      const el = wcRef.current
      if (!el) return
      ;(el as any).articles = articles
      ;(el as any).icons = icons
    }, [articles, icons])

    useEffect(() => {
      const el = wcRef.current
      if (!el) return
      const handler = (e: Event) => {
        const d = (e as CustomEvent).detail
        onArticleSelect?.(d.id, d.cat)
      }
      const closeHandler = () => onViewerClose?.()
      el.addEventListener('article-select', handler)
      el.addEventListener('viewer-close', closeHandler)
      return () => {
        el.removeEventListener('article-select', handler)
        el.removeEventListener('viewer-close', closeHandler)
      }
    }, [onArticleSelect, onViewerClose])

    return <article-viewer ref={wcRef}></article-viewer>
  }
)

export default ArticleViewer