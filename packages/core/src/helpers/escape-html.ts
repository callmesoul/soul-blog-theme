/** HTML 转义（模板字符串中拼接用户输入 / 搜索词时使用） */
export function escapeHtml (value: unknown): string {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char] as string))
}