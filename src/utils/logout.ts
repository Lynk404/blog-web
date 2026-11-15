import { ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/user'

/**
 * 弹出二次确认框，确认后清除登录态。
 * 返回 true 表示已退出，调用方负责页面跳转。
 * 不在此处 import router，避免 router → layouts → utils/logout → router 的循环依赖。
 */
export async function confirmLogout(): Promise<boolean> {
  try {
    await ElMessageBox.confirm('确认退出登录？', '退出登录', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    // 点击取消或关闭弹窗
    return false
  }
  useUserStore().logout()
  return true
}
