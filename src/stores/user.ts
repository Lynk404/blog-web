import { defineStore } from 'pinia'
import { ref } from 'vue'
import base from '../config/base.config'
import type { UserProfile } from '../types/api'
import storage from '../utils/storage'

export const useUserStore = defineStore('user', () => {
  // 登录态以 localStorage 中的 token 为准，启动时由 utils/session 校验有效性
  const isLoggedIn = ref(storage.get(base.TOKEN_NAME) !== null)
  const uid = ref<string | null>(storage.get(base.UID_NAME))
  const profile = ref<UserProfile | null>(null)

  function login() {
    isLoggedIn.value = true
    uid.value = storage.get(base.UID_NAME)
  }

  function setProfile(next: UserProfile) {
    profile.value = next
  }

  function logout() {
    storage.remove(base.TOKEN_NAME)
    storage.remove(base.UID_NAME)
    isLoggedIn.value = false
    uid.value = null
    profile.value = null
  }

  return { isLoggedIn, uid, profile, login, setProfile, logout }
})
