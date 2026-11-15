import { defineStore } from 'pinia'
import { ref } from 'vue'
import base from '../config/base.config'
import storage from '../utils/storage'

export const useUserStore = defineStore('user', () => {
  const isLoggedIn = ref(storage.get(base.TOKEN_NAME) !== null)
  const uid = ref<string | null>(storage.get(base.UID_NAME))

  function login() {
    isLoggedIn.value = true
    uid.value = storage.get(base.UID_NAME)
  }

  function logout() {
    storage.remove(base.TOKEN_NAME)
    storage.remove(base.UID_NAME)
    isLoggedIn.value = false
    uid.value = null
  }

  return { isLoggedIn, uid, login, logout }
})
