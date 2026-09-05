import { useRef, useEffect } from 'react'
import type { Category, SocialItem } from '@soul-blog/wc'

interface Props {
  categories: Category[]
  social: SocialItem[]
  siteName: string
  icp: string
  activeCat: string
  onNavigate?: (cat: string) => void
}

export default function SiteSidebar({ categories, social, siteName, icp, activeCat, onNavigate }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    ;(el as any).categories = categories
    ;(el as any).social = social
    ;(el as any).siteName = siteName
    ;(el as any).icp = icp
  }, [categories, social, siteName, icp])

  useEffect(() => {
    ref.current?.setAttribute('active-cat', activeCat)
  }, [activeCat])

  useEffect(() => {
    const el = ref.current
    if (!el || !onNavigate) return
    const handler = (e: Event) => onNavigate((e as CustomEvent).detail.cat)
    el.addEventListener('navigate', handler)
    return () => el.removeEventListener('navigate', handler)
  }, [onNavigate])

  return <site-sidebar ref={ref} active-cat="all"></site-sidebar>
}