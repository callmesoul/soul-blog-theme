const VERCOUNT_API_URL = 'https://events.vercount.one/api/v2/log'
const VERCOUNT_PAGE_VIEW_EVENT = 'vercount-page-view'
const REQUEST_TIMEOUT_MS = 5000

export interface VercountData {
  sitePv: number
  siteUv: number
  pagePv: number
}

interface VercountPayload {
  status?: string
  data?: {
    site_pv?: unknown
    site_uv?: unknown
    page_pv?: unknown
  }
  site_pv?: unknown
  site_uv?: unknown
  page_pv?: unknown
}

const articleReadCache = new Map<string, Promise<number | null>>()
let articleWriteStarted = false
let articleWriteSequence = 0
let initialVisitTimer: number | null = null

function toCount (value: unknown): number {
  const count = Number(value)
  return Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0
}

function normalizePayload (payload: VercountPayload): VercountData | null {
  if (payload.status === 'error') return null
  const data = payload.data || payload
  return {
    sitePv: toCount(data.site_pv),
    siteUv: toCount(data.site_uv),
    pagePv: toCount(data.page_pv)
  }
}

function visitorCookieName (): string {
  return `vercount_uv_${window.location.host.replace(/[^a-zA-Z0-9_-]/g, '_')}`
}

function isNewVisitor (): boolean {
  const name = visitorCookieName()
  const found = document.cookie.split('; ').some(item => item.startsWith(`${name}=`))
  if (!found) {
    document.cookie = `${name}=1; path=/; max-age=31536000; samesite=lax`
  }
  return !found
}

async function requestVercount (url: string, write: boolean): Promise<VercountData | null> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(
      write ? VERCOUNT_API_URL : `${VERCOUNT_API_URL}?url=${encodeURIComponent(url)}`,
      write
        ? {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, isNewUv: isNewVisitor() }),
            signal: controller.signal
          }
        : { method: 'GET', signal: controller.signal }
    )
    if (!response.ok) return null
    return normalizePayload(await response.json() as VercountPayload)
  } catch {
    return null
  } finally {
    window.clearTimeout(timeout)
  }
}

function updateCounter (id: string, value: number): void {
  const node = document.getElementById(id)
  if (!node) return
  node.textContent = String(value)
  node.classList.remove('is-loading')
  node.removeAttribute('aria-busy')
}

function finishCounterLoading (id: string): void {
  const node = document.getElementById(id)
  if (!node?.classList.contains('is-loading')) return
  node.textContent = '—'
  node.classList.remove('is-loading')
  node.removeAttribute('aria-busy')
}

function finishSiteCounterLoading (): void {
  finishCounterLoading('vercount_value_site_pv')
  finishCounterLoading('vercount_value_site_uv')
}

function renderSiteCounters (data: VercountData): void {
  updateCounter('vercount_value_site_pv', data.sitePv)
  updateCounter('vercount_value_site_uv', data.siteUv)
}

function renderCounters (data: VercountData): void {
  renderSiteCounters(data)
  updateCounter('vercount_value_page_pv', data.pagePv)
}

/** 为所有主题生成一致的、不会受 hash 路由影响的文章统计 URL。 */
export function vercountArticleUrl (articleId: string): string {
  return new URL(`/articles/${encodeURIComponent(articleId)}`, window.location.origin).href
}

/** 打开文章时记录一次 PV，并通知列表更新对应卡片。 */
export async function recordVercountArticleView (articleId: string): Promise<number | null> {
  articleWriteStarted = true
  const writeSequence = ++articleWriteSequence
  if (initialVisitTimer !== null) {
    window.clearTimeout(initialVisitTimer)
    initialVisitTimer = null
  }

  const url = vercountArticleUrl(articleId)
  const data = await requestVercount(url, true)
  if (!data) {
    finishSiteCounterLoading()
    return null
  }

  // page PV 由 article-viewer 在确认仍是当前文章后写入，
  // 避免快速切文时较旧请求的响应覆盖新文章计数。
  if (writeSequence === articleWriteSequence) renderSiteCounters(data)
  articleReadCache.set(url, Promise.resolve(data.pagePv))
  window.dispatchEvent(new CustomEvent(VERCOUNT_PAGE_VIEW_EVENT, {
    detail: { articleId, views: data.pagePv }
  }))
  return data.pagePv
}

/** 首页文章卡片只读查询，不会增加页面或站点 PV。 */
export function readVercountArticleView (articleId: string): Promise<number | null> {
  const url = vercountArticleUrl(articleId)
  const cached = articleReadCache.get(url)
  if (cached) return cached

  const request = requestVercount(url, false).then(data => {
    if (!data) articleReadCache.delete(url)
    return data?.pagePv ?? null
  })
  articleReadCache.set(url, request)
  return request
}

export { VERCOUNT_PAGE_VIEW_EVENT }

/**
 * 非文章页面加载后记录一次普通页面访问。直接访问带 art 的 SPA 地址时跳过，
 * 交给 article-viewer 以 /articles/{id} 记录，避免一次加载重复计数。
 */
export function scheduleInitialVercountVisit (): void {
  if (typeof window === 'undefined') return

  const schedule = () => {
    if (/(?:^|[&#])art=/.test(window.location.hash)) return
    initialVisitTimer = window.setTimeout(async () => {
      initialVisitTimer = null
      if (articleWriteStarted) return
      const data = await requestVercount(window.location.href, true)
      // 请求期间若已打开文章，则由文章请求接管展示，
      // 避免较旧的首页响应覆盖阅读器计数。
      if (articleWriteStarted) return
      if (data) renderCounters(data)
      else finishSiteCounterLoading()
    }, 150)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true })
  } else {
    schedule()
  }
}
