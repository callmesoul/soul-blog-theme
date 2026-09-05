import type { DetailedHTMLProps, HTMLAttributes } from 'react'

type CustomElement<T> = DetailedHTMLProps<HTMLAttributes<T>, T>

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'site-background': CustomElement<HTMLElement> & { image?: string }
      'site-sidebar': CustomElement<HTMLElement> & { 'active-cat'?: string }
      'article-list': CustomElement<HTMLElement> & { 'active-cat'?: string }
      'article-viewer': CustomElement<HTMLElement>
      'search-panel': CustomElement<HTMLElement>
      'search-results': CustomElement<HTMLElement>
      'music-player': CustomElement<HTMLElement>
      'login-panel': CustomElement<HTMLElement> & { 'remembered-username'?: string }
    }
  }
}