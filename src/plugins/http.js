import http from '@/api/http'

const install = function (app) {
  if (install.installed) return
  install.installed = true
  
  app.config.globalProperties.$api = http
}

export default install