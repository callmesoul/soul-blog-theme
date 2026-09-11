import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import type { Article } from '@soul-blog/wc'

interface Props {
  article: Article | null
  articles: Article[]
  icons: Record<string, string>
  onArticleSelect?: (id: string, cat: string) => void
  onTagSelect?: (tag: string) => void
  onViewerClose?: () => void
}

export interface ArticleViewerHandle {
  openWithFlip: (cardEl: HTMLElement | null, siteName: string) => void
  closeWithFlip: () => void
}

const ArticleViewer = forwardRef<ArticleViewerHandle, Props>(
  function ArticleViewer({ article, articles, icons, onArticleSelect, onTagSelect, onViewerClose }, ref) {
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

    // 阅读器内标签点击：preventDefault 表示已由宿主接管路由，
    // 组件将不再自行关闭阅读器/改写 location.hash
    useEffect(() => {
      const el = wcRef.current
      if (!el) return
      const tagHandler = (e: Event) => {
        ;(e as CustomEvent).preventDefault()
        onTagSelect?.(((e as CustomEvent).detail as any)?.tag)
      }
      el.addEventListener('tag-select', tagHandler)
      return () => el.removeEventListener('tag-select', tagHandler)
    }, [onTagSelect])

    return (
      <article-viewer ref={wcRef}>
        <span slot="page-views" id="vercount_value_page_pv" aria-label="本文阅读量">—</span>
      </article-viewer>
    )
  }
)

export default ArticleViewer
