/** HTML 转义（模板字符串中拼接用户输入 / 搜索词时使用） */
export function escapeHtml (value: unknown): string {
  // null / undefined 输出空串：缺字段的属性不能变成 src="undefined"
  if (value == null) return ''
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char] as string))
}