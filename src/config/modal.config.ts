import type { FormType } from './form.config'

export interface ModalButton {
  targetName: 'close' | 'confirm'
  name: string
  isSubmit?: boolean
}

export interface ModalConfig {
  title: string
  formType: FormType
  btns: ModalButton[]
}

const CLOSE_BTN: ModalButton = { targetName: 'close', name: '取消' }

const MODAL_CONFIG: Record<FormType, ModalConfig> = {
  login: {
    title: '登录',
    formType: 'login',
    btns: [CLOSE_BTN, { targetName: 'confirm', name: '登录', isSubmit: true }],
  },
  column: {
    title: '添加分类',
    formType: 'column',
    btns: [CLOSE_BTN, { targetName: 'confirm', name: '提交', isSubmit: true }],
  },
  register: {
    title: '注册',
    formType: 'register',
    btns: [CLOSE_BTN, { targetName: 'confirm', name: '注册', isSubmit: true }],
  },
  userInfo: {
    title: '个人信息',
    formType: 'userInfo',
    btns: [CLOSE_BTN, { targetName: 'confirm', name: '提交', isSubmit: true }],
  },
}

export default MODAL_CONFIG
