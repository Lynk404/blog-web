import './assets/main.css'
// ElMessage / ElMessageBox / ElNotification 为函数式 API，按需导入不会带上样式，需在此显式引入
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-notification.css'
import 'element-plus/theme-chalk/el-overlay.css'

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

  // 等首个路由组件（含懒加载 chunk）就绪后再挂载，首屏 splash 保持一致覆盖
  await router.isReady().catch(() => undefined)
  app.mount('#app')

  const splash = document.getElementById('app-splash')
  if (splash) {
    splash.classList.add('is-hidden')
    window.setTimeout(() => splash.remove(), 240)
  }
}

void bootstrap()
