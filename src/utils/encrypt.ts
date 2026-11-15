import request, { type ApiEnvelope } from '../api/request'
import base from '../config/base.config'
import storage from './storage'

/** 将 PEM（SPKI）公钥转换为 DER 字节 */
function pemToDer(pem: string): Uint8Array<ArrayBuffer> {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

/** 清除缓存的公钥，下次加密时重新从 /keys 获取（服务端换密钥后使用） */
export function clearPublicKey(): void {
  storage.remove(base.PUBKEY_NAME)
}

/**
 * 使用 RSA-OAEP + SHA-1 加密明文，返回 base64 密文。
 * 服务端只接受该算法，不要改为 SHA-256 或 JSEncrypt。
 */
export default async function encrypt(value: string): Promise<string> {
  let pem = storage.get(base.PUBKEY_NAME)
  if (!pem) {
    const { data } = await request.get<ApiEnvelope<{ pubKey: string }>>('/keys')
    pem = data.data.pubKey
    storage.set(base.PUBKEY_NAME, pem)
  }

  const key = await crypto.subtle.importKey(
    'spki',
    pemToDer(pem),
    { name: 'RSA-OAEP', hash: 'SHA-1' },
    false,
    ['encrypt'],
  )
  const cipher = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    key,
    new TextEncoder().encode(value),
  )
  return btoa(String.fromCharCode(...new Uint8Array(cipher)))
}
