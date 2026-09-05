/**
 * 持久化存储（localStorage 包装，异常时降级到内存）
 * 与 themes/vanilla/src/js/main.js 中的 store 实现一致
 */
export const store = (() => {
  let mem: Record<string, unknown> = {}
  try {
    const t = '__soul_blog_test__'
    localStorage.setItem(t, '1')
    localStorage.removeItem(t)
    return {
      get<T> (key: string, fallback: T): T {
        try {
          const v = localStorage.getItem(key)
          return v == null ? fallback : JSON.parse(v) as T
        } catch { return fallback }
      },
      set (key: string, val: unknown): void {
        try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* noop */ }
      }
    }
  } catch {
    return {
      get<T> (key: string, fallback: T): T { return key in mem ? mem[key] as T : fallback },
      set (key: string, val: unknown): void { mem[key] = val }
    }
  }
})()