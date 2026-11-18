import axios from 'axios'
import base from '../config/base.config'
import { useUserStore } from '../stores/user'
import storage from '../utils/storage'

/** 服务端统一响应结构：成功 `{ message, data }`，DELETE 可能为 `{ errMsg }` */
export interface ApiEnvelope<T = unknown> {
  message?: string
  data: T
  errMsg?: string
}

type UnauthorizedHandler = () => void

let onUnauthorized: UnauthorizedHandler | null = null

/**
 * 注册 401 处理函数（由 main.ts 设置，负责跳转登录页）。
 * 通过注册而非直接 import router，避免 router → views → api → request 的循环依赖。
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler
}

const request = axios.create({
  // 未配置时走同源（生产同域名部署）；开发环境由 .env.development 提供后端地址
  baseURL: import.meta.env.VITE_APP_BASE_URL || '',
  timeout: base.TIMEOUT,
})

request.interceptors.request.use((config) => {
  const token = storage.get(base.TOKEN_NAME)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(undefined, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    useUserStore().logout()
    onUnauthorized?.()
  }
  return Promise.reject(error)
})

export default request
