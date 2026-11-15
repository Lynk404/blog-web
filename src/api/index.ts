import axios from 'axios'
import { ElNotification } from 'element-plus'
import API_LIST, { type ApiEntry, type ApiType } from '../config/api.config'
import base from '../config/base.config'
import { useUserStore } from '../stores/user'
import encrypt, { clearPublicKey } from '../utils/encrypt'
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

function rsaFieldsOf(entry: ApiEntry): string[] {
  if (!entry.rsaKey) return []
  return Array.isArray(entry.rsaKey) ? entry.rsaKey : [entry.rsaKey]
}

function isClientError(error: unknown): boolean {
  if (!axios.isAxiosError(error) || !error.response) return false
  const status = error.response.status
  return status >= 400 && status < 500
}

/** 复制请求数据并加密指定字段，不修改调用方传入的对象 */
async function buildPayload(
  source: Record<string, unknown>,
  fields: string[],
): Promise<Record<string, unknown>> {
  const payload = { ...source }
  for (const field of fields) {
    const plain = payload[field]
    if (typeof plain === 'string') {
      payload[field] = await encrypt(plain)
    }
  }
  return payload
}

async function send<T>(entry: ApiEntry, url: string, payload: Record<string, unknown>): Promise<T> {
  const config =
    entry.method === 'GET'
      ? { url, method: entry.method, params: payload }
      : { url, method: entry.method, data: payload }
  const { data: body } = await request.request<ApiEnvelope<T>>(config)
  return body.data
}

/** 统一请求入口：所有接口通过 API_LIST 中的 type 调用 */
export default async function Http<T = unknown>({ type, data = {} }: HttpOptions): Promise<T> {
  const entry = API_LIST[type]
  const fields = rsaFieldsOf(entry)
  let url = entry.url
  if (entry.rest) {
    const param = url.match(/:(\w+)$/)?.[1]
    if (param) {
      url = url.replace(/:\w+$/, String(data[param]))
    }
  }

  for (let attempt = 1; ; attempt++) {
    // 本次加密是否使用了缓存的公钥（缓存可能已因服务端换密钥而失效）
    const usedCachedKey = fields.length > 0 && storage.get(base.PUBKEY_NAME) !== null
    try {
      const payload = await buildPayload(data, fields)
      const result = await send<T>(entry, url, payload)

      if (entry.setToken) {
        const { token, userId } = result as unknown as AuthResult
        storage.set(base.UID_NAME, String(userId))
        storage.set(base.TOKEN_NAME, token)
        useUserStore().login()
      }
      return result
    } catch (error) {
      // 换密钥后旧公钥加密的请求会被拒绝：清除缓存，重新获取公钥后重试一次
      if (usedCachedKey && attempt === 1 && isClientError(error)) {
        clearPublicKey()
        continue
      }
      if (!entry.noMessage && axios.isAxiosError(error) && error.response) {
        const message = (error.response.data as { message?: string } | undefined)?.message
        ElNotification({ title: '请求错误', message: message ?? '请求失败', type: 'error' })
      }
      throw error
    }
  }
}
