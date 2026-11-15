/**
 * 校验登录后的跳转地址，只允许站内绝对路径（以 `/` 开头且非 `//`），防止开放重定向。
 */
export function safeRedirect(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string') return fallback
  if (!value.startsWith('/') || value.startsWith('//')) return fallback
  return value
}
