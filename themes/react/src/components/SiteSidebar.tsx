import { useRef, useEffect } from 'react'
import type { Category, SocialItem } from '@soul-blog/wc'

interface Props {
  categories: Category[]
  tags?: { name: string; count: number }[]
  social: SocialItem[]
  siteName: string
  icp: string
  activeCat: string
  activeTag?: string
  /** 归档页地址（默认 /archives），设为 '' 可隐藏归档导航 */
  archiveUrl?: string
  onNavigate?: (cat: string, tag?: string) => void
}

export default function SiteSidebar({ categories, tags, social, siteName, icp, activeCat, activeTag, archiveUrl = '/archives', onNavigate }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    ;(el as any).categories = categories
    ;(el as any).tags = tags
    ;(el as any).social = social
    ;(el as any).siteName = siteName
    ;(el as any).icp = icp
    ;(el as any).archiveUrl = archiveUrl
  }, [categories, tags, social, siteName, icp, archiveUrl])

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
    if (!el || !onNavigate) return
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail
      onNavigate(d.cat, d.tag)
    }
    el.addEventListener('navigate', handler)
    return () => el.removeEventListener('navigate', handler)
  }, [onNavigate])

  return <site-sidebar ref={ref} active-cat="all"></site-sidebar>
}