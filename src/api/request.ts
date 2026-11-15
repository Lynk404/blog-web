import axios from 'axios'
import base from '../config/base.config'
import storage from '../utils/storage'

/** 服务端统一响应结构：成功 `{ message, data }`，DELETE 可能为 `{ errMsg }` */
export interface ApiEnvelope<T = unknown> {
  message?: string
  data: T
  errMsg?: string
}

const request = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_URL,
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
  // TODO: 跳转登录页，待登录页与路由守卫实现后补充
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    storage.remove(base.TOKEN_NAME)
  }
  return Promise.reject(error)
})

export default request
