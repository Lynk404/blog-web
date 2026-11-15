import Http from '../api'
import { useUserStore } from '../stores/user'
import type { UserProfile } from '../types/api'

/** 拉取当前用户资料（GET /user）并写入 store */
export async function refreshProfile(): Promise<UserProfile> {
  const profile = await Http<UserProfile>({ type: 'getUserInfo' })
  useUserStore().setProfile(profile)
  return profile
}

/**
 * 启动时校验本地保存的 token（GET /index）。
 * 过期时 request 拦截器会清除登录态（401），这里不再额外处理；
 * 网络错误时保留登录态，避免离线时误登出。
 */
export async function restoreSession(): Promise<void> {
  const user = useUserStore()
  if (!user.isLoggedIn) return
  try {
    await Http({ type: 'index' })
    await refreshProfile()
  } catch {
    // 401 已由拦截器处理；其他错误保持现状
  }
}
