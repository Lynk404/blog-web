import { ElMessageBox } from 'element-plus'

/**
 * 危险操作的二次确认（删除等）。弹框期间蒙版挡住页面，点蒙版或按 Esc 不关闭。
 * 返回 true 表示用户确认。
 */
export async function confirmAction(message: string, title: string, confirmText: string): Promise<boolean> {
  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: confirmText,
      cancelButtonText: '取消',
      type: 'warning',
      closeOnClickModal: false,
      closeOnPressEscape: false,
    })
    return true
  } catch {
    return false
  }
}
