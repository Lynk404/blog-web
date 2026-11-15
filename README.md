# Bug论坛（BugForum） · 前端（blog-web）

北境论坛前端应用，基于 Vue 3 + Vite 构建，对接 `blog-server` 后端服务。

---

## 技术栈

| 技术 | 版本 | 说明 |
| --- | --- | --- |
| Vue.js | 3.5.13 | 前端框架（Composition API + `<script setup>`） |
| Vue Router | 4.6.4 | 路由管理 |
| Element Plus | 2.8.5 | UI 组件库 |
| Vite | 4.5.3 | 构建工具 |
| Axios | 1.7.9 | HTTP 请求 |
| v-md-editor | 2.3.18 | Markdown 编辑器 |
| JSEncrypt | 3.5.4 | RSA 加密（敏感字段传输） |

> 版本号以 `package.json` 锁定版本为准。

---

## 目录结构

```text
blog-web/
├── public/                 # 静态资源
├── src/
│   ├── api/                # 接口封装，按业务域拆分
│   │   ├── request.ts      # Axios 实例与拦截器
│   │   ├── user.ts
│   │   ├── post.ts
│   │   └── ...
│   ├── assets/             # 参与构建的静态资源（图片、字体等）
│   ├── components/         # 跨页面复用组件
│   ├── config/             # 配置
│   ├── plugins/            # 插件（HTTP 等插件）
│   ├── layouts/            # 布局组件
│   ├── router/             # 路由配置
│   ├── stores/             # Pinia 状态管理
│   ├── styles/             # 全局样式、变量
│   ├── utils/              # 工具函数（加密、格式化、校验等）
│   ├── views/              # 页面级组件
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── README.md
└── ...
```

---

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0（或 pnpm >= 8）
- 后端服务 `blog-server` 已启动并可访问

---

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
```

<!-- 默认服务地址：`http://127.0.0.1:3000` -->

---

## 环境变量

在项目根目录 .env.development / .env.production

## 开发规范

### 组件

- 统一使用 **Composition API** + `<script setup lang="ts">`，禁止 Options API。
- 组件名使用 PascalCase，文件名与组件名一致。
- 样式统一使用 `<style scoped>`，全局样式放在 `src/styles/`。
- 跨页面复用 ≥ 2 次的逻辑抽取为 `composables/useXxx.ts`。

### API 请求

- **所有请求必须经过 `src/api/` 封装，禁止在组件中直接调用 axios。**
- `src/api/request.ts` 统一处理：
  - `baseURL`
  - Token 注入（JWT）
  - 响应错误统一提示
  - 401 跳转登录
- 按业务域拆分文件，例如 `api/post.ts` 只放帖子相关接口。

### 路由

- 路由配置集中在 `src/router/index.ts`。
- 页面级路由使用懒加载：`component: () => import('@/views/xxx/Xxx.vue')`。
- 需要登录的页面在 `meta` 中标记 `requiresAuth: true`，由全局守卫统一处理。

### 敏感数据加密

- RSA 加密统一封装在 `src/utils/encrypt.ts`，组件中只调用工具函数，**禁止在组件里直接 `new JSEncrypt()`**。
- 公钥通过环境变量或后端接口获取，不要硬编码在业务代码中。

### Markdown 编辑器

- 统一使用 `v-md-editor`，封装为 `components/MarkdownEditor.vue`，业务页面引用该封装组件，不直接引入原始库。
- 主题样式在 `main.ts` 中统一引入。

### 依赖管理

- 新增第三方依赖需说明理由，避免引入功能重复的库。
- 不随意修改 `vite.config.ts`、`tsconfig.json` 等工程配置。

## 对接后端

- 开发环境通过 Vite `server.proxy` 转发到 `blog-server`，避免跨域。
- 接口契约统一维护在仓库根目录 `docs/api.md`，前后端同步更新。
- 后端微服务（gateway / userService / postService 等）对前端透明，前端只关心网关暴露的统一入口。

## 构建与部署

```bash
# 生产构建
npm run build
```

构建产物位于 `dist/`，部署方式二选一：

1. **Nginx 静态托管**（推荐）
   - 将 `dist/` 内容部署到 Nginx 静态目录。
   - 配置 `try_files $uri $uri/ /index.html;` 支持 history 路由。
   - 配置 `/api` 反向代理到 `blog-server` 网关。

2. **容器化部署**
   - 使用多阶段构建：Node 构建 → Nginx 托管。
   - 确保 `VITE_API_BASE_URL` 在构建时注入正确。

## 常见问题

**Q：Element Plus 组件样式丢失？**
确认已按需自动导入配置（`unplugin-vue-components` + `unplugin-auto-import`），或在 `main.ts` 中正确引入样式。

## 相关文档

- 接口契约：`./docs/api.md`
- 后端服务：`../blog-server/README.md`