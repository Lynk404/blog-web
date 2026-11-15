import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './api/request'
import { restoreSession } from './utils/session'

async function bootstrap() {
  const app = createApp(App)
  app.use(createPinia())

  // 先校验本地 token，再安装路由，保证路由守卫读取到的是校验后的登录态
  await restoreSession()

  app.use(router)

  // 接口返回 401：清除登录态并跳转登录页（已在登录页时不重复跳转）
  setUnauthorizedHandler(() => {
    const current = router.currentRoute.value
    if (current.name === 'login') return
    router.push({ name: 'login', query: { redirect: current.fullPath } })
  })

  app.mount('#app')
}

void bootstrap()
