import axios from 'axios'
import { ElNotification } from 'element-plus'
import API_LIST, { type ApiType } from '../config/api.config'
import base from '../config/base.config'
import { useUserStore } from '../stores/user'
import encrypt from '../utils/encrypt'
import storage from '../utils/storage'
import request, { type ApiEnvelope } from './request'

export interface HttpOptions {
  type: ApiType
  data?: Record<string, unknown>
}

interface AuthResult {
  token: string
  userId: string
}

/** 统一请求入口：所有接口通过 API_LIST 中的 type 调用 */
export default async function Http<T = unknown>({ type, data = {} }: HttpOptions): Promise<T> {
  const entry = API_LIST[type]
  const payload: Record<string, unknown> = { ...data }
  let url = entry.url

  try {
    if (entry.rest) {
      const param = url.match(/:(\w+)$/)?.[1]
      if (param) {
        url = url.replace(/:\w+$/, String(payload[param]))
      }
    }
    const rsaField = entry.rsaKey
    const plain = rsaField ? payload[rsaField] : undefined
    if (rsaField && typeof plain === 'string') {
      payload[rsaField] = await encrypt(plain)
    }

    const config =
      entry.method === 'GET'
        ? { url, method: entry.method, params: payload }
        : { url, method: entry.method, data: payload }
    const { data: body } = await request.request<ApiEnvelope<T>>(config)
    const result = body.data

    if (entry.setToken) {
      const { token, userId } = result as unknown as AuthResult
      storage.set(base.UID_NAME, String(userId))
      storage.set(base.TOKEN_NAME, token)
      useUserStore().login()
    }
    return result
  } catch (error) {
    if (!entry.noMessage && axios.isAxiosError(error) && error.response) {
      const message = (error.response.data as { message?: string } | undefined)?.message
      ElNotification({ title: '请求错误', message: message ?? '请求失败', type: 'error' })
    }
    throw error
  }
}
