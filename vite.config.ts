import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  // 图片以相对路径存储（/article/...、/user/...、/images/...），开发时转发到后端；线上由 Nginx 同域提供
  // 代理键带尾斜杠，避免 /user/ 误匹配前端路由 /users/:id
  const imageProxyTarget = env.VITE_APP_BASE_URL || 'http://127.0.0.1:3000'

  return {
    plugins: [
      vue(),
      vueDevTools(),
      // Element Plus 按需导入：组件与 API（ElNotification 等）自动引入，样式随组件加载
      AutoImport({
        resolvers: [ElementPlusResolver()],
        dts: 'src/auto-imports.d.ts',
      }),
      Components({
        resolvers: [ElementPlusResolver({ importStyle: 'css' })],
        dts: 'src/components.d.ts',
      }),
    ],
    server: {
      proxy: {
        '/article/': imageProxyTarget,
        '/user/': imageProxyTarget,
        '/images/': imageProxyTarget,
      },
    },
  }
})
