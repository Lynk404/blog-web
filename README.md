# Bug论坛（BugForum） · 前端（blog-web）

Bug论坛前端应用，基于 Vue 3 + Vite + TypeScript 构建，对接 `blog-server` 后端服务。

---

## 技术栈

| 技术 | 版本（package.json） | 说明 |
| --- | --- | --- |
| Vue | ^3.5.32 | 前端框架（Composition API + `<script setup>`） |
| Vue Router | ^5.0.4 | 路由管理 |
| Pinia | ^3.0.4 | 状态管理 |
| Element Plus | ^2.14.8 | UI 组件库，按需导入 |
| Vite | ^8.0.8 | 构建工具 |
| TypeScript | ~6.0.0 | 类型检查（`vue-tsc`） |
| Axios | ^1.21.1 | HTTP 请求 |
| nprogress | ^0.2.0 | 路由跳转顶部进度条（`src/router/index.ts`） |
| @kangc/v-md-editor | ^2.3.18 | Markdown 编辑与预览（Vue 3 版本；1.x 为 Vue 2，不兼容）。编辑器与预览按需加载 |
| codemirror | ^5.65.21 | v-md-editor 2.x 不内置编辑器内核，由 `MarkdownEditor.vue` 注入。版本与库的依赖一致 |
| unplugin-auto-import / unplugin-vue-components | ^21.1.0 / ^32.1.0 | Element Plus 按需导入 |

> 版本以 `package.json` 为准。

---

## 目录结构

```text
blog-web/
├── .claude/                   # Claude Code 配置：rules/（Karpathy 编码规则）、skills/（ui-ux-pro-max）
├── docs/                      # 接口契约与对接文档
├── public/                    # 静态资源（原样拷贝到构建产物）
├── src/
│   ├── api/
│   │   ├── request.ts         # axios 实例与拦截器（Token 注入、401 清除登录态并触发跳转）
│   │   └── index.ts           # 统一请求入口 Http()，所有接口经此调用
│   ├── assets/                # 参与构建的静态资源（main.css 为全局样式）
│   ├── components/            # AppBrand.vue（logo）、MarkdownEditor.vue / MarkdownPreview.vue（v-md-editor 封装）、profile/（编辑资料、修改密码、注销账号弹窗）
│   ├── config/                # 接口表、基础配置、表单与弹窗、校验规则
│   ├── layouts/               # AppLayout.vue（顶部导航 + 头像菜单）、AuthLayout.vue（登录、注册、个人主页，无导航）
│   ├── router/                # 路由配置与守卫
│   ├── stores/                # Pinia 状态（user.ts）
│   ├── types/                 # 接口数据类型（api.ts）、md-editor.d.ts（v-md-editor 类型声明）
│   ├── utils/                 # storage（localStorage 封装）、encrypt（RSA 加密）、redirect（跳转校验）、session（自动登录与资料）、logout（退出确认）、confirm（危险操作二次确认）
│   ├── views/                 # 页面：首页、文章详情与发布、专栏列表/详情、个人主页、登录、注册、404
│   ├── auto-imports.d.ts      # 自动生成（unplugin-auto-import），勿手改
│   ├── components.d.ts        # 自动生成（unplugin-vue-components），勿手改
│   ├── App.vue                # 仅 <RouterView />
│   └── main.ts
├── env.d.ts                   # 环境变量类型声明
├── index.html
├── vite.config.ts
├── tsconfig.app.json
└── package.json
```

---

## 环境要求

- Node.js `^20.19.0 || >=22.12.0`（与 `package.json` 的 `engines` 一致）
- npm
- 后端服务 `blog-server` 已启动并可访问（默认 `http://127.0.0.1:3000`）

---

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
```

---

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 并行执行类型检查（`vue-tsc --build`）与生产构建，产物输出到 `dist/` |
| `npm run build-only` | 仅执行 `vite build`，不做类型检查 |
| `npm run type-check` | 仅执行类型检查 |
| `npm run preview` | 本地预览 `dist/` |
| `npm run format` | 使用 Prettier 格式化 `src/` |

项目未配置测试框架与 lint。

---

## 环境变量

（待补充，后续统一说明。）

---

## 开发规范

### 组件

- 统一使用 **Composition API** + `<script setup lang="ts">`，禁止 Options API。
- 组件名使用 PascalCase，文件名与组件名一致。
- 样式使用 `<style scoped>`，全局样式统一放在 `src/assets/main.css`。
- Element Plus 组件通过 `unplugin-vue-components` 按需自动导入，模板中直接使用即可，无需手动 import。
- 函数式 API（`ElMessage`、`ElMessageBox`、`ElNotification`）的样式在 `src/main.ts` 显式引入，新增同类 API 时需同样处理。
- 同一逻辑在两个及以上页面复用时，抽取为 `composables/useXxx.ts`。

### 导入路径

- 项目内导入一律使用**相对路径**，不使用 `@` 别名（已移除）。

### API 请求

- **所有请求必须经过 `src/api/`，组件中禁止直接调用 axios。**
- 接口在 `src/config/api.config.ts` 中以 `type` 命名登记（`url`、`method`、`rsaKey`、`rest`、`setToken`、`noMessage`）。
- 调用方式：`Http({ type, data })`，定义于 `src/api/index.ts`。
- `src/api/request.ts` 统一处理 `baseURL`、Token 注入（`Authorization: Bearer`）与 401：清除登录态后，由 `main.ts` 注册的处理函数跳转登录页。
- 路径参数（如 `getArticleById` 的 `:id`）由 `Http` 替换进 url，不再随请求发送。
- 上传接口的 `data` 传入 `FormData`，原样发送，不做加密。

### 敏感数据加密

- 密码等字段通过 `src/utils/encrypt.ts` 加密（WebCrypto，RSA-OAEP + SHA-1），组件中只调用该工具，不自行实现加密。
- 公钥由 `GET /keys` 获取并缓存于 `localStorage`，不要硬编码在业务代码中。缓存失效时自动重新获取并重试一次。
- 需要加密的接口在 `src/config/api.config.ts` 中用 `rsaKey` 声明，支持单个字段或字段数组。
- `crypto.subtle` 仅在 HTTPS 或 `localhost` 下可用，部署时必须启用 HTTPS。

### 路由

- 路由配置集中在 `src/router/index.ts`。主站页面挂载在 `AppLayout`（带顶部导航）下；登录、注册、个人主页挂载在 `AuthLayout`（无导航）下，未匹配路径进入 404 页面。
- 页面组件使用懒加载：`component: () => import('../views/Xxx.vue')`。
- `meta.requiresAuth` 标记需登录页面（发布文章、个人主页），`meta.guestOnly` 标记仅未登录可访问的页面（登录、注册），`meta.centered` 标记认证布局中内容需上下居中的页面（登录、注册）。守卫在 `router.beforeEach` 中处理。
- 登录后的跳转地址经 `src/utils/redirect.ts` 的 `safeRedirect` 校验，仅允许站内路径。
- 每次路由跳转由 `router.beforeEach` 启动顶部进度条（nprogress），`afterEach` 与 `onError` 结束。

### 已实现页面

| 路径 | 页面 | 说明 |
| --- | --- | --- |
| `/` | 首页 | 文章列表、关键词搜索、分页（每页 10 条）；登录后显示"写文章" |
| `/articles/new` | 发布文章 | 需登录。标题、正文、专栏（仅本人专栏）；正文发送前编码 |
| `/articles/:id` | 文章详情 | Markdown 正文（xss 过滤）、评论；登录后可点赞（本页限一次）、发表评论；作者可编辑、删除文章；作者可编辑、删除自己的评论 |
| `/articles/:id/edit` | 编辑文章 | 需登录，仅作者。Markdown 编辑；专栏只读（后端不允许修改所属专栏） |
| `/columns` | 专栏列表 | 登录后可新建专栏（名称唯一） |
| `/columns/:id` | 专栏详情 | 专栏下文章（未分页）；作者可修改专栏名、删除专栏（删除前提示级联删除他人文章） |
| `/me` | 个人主页 | 需登录，独立页面（无导航栏）。展示资料与统计；更换头像、编辑资料（昵称、邮箱）、修改密码、注销账号（均需确认）；退出登录 |
| `/login` | 登录 | 独立页面，无导航栏，仅做必填校验 |
| `/register` | 注册 | 独立页面，使用 `validate.config.ts` 完整规则 |
| 其他 | 404 | |

### 登录与自动登录

- 登录态保存在 `localStorage`（token 键 `ua_jot`），刷新页面后自动恢复：启动时调用 `GET /index` 校验，通过后拉取 `GET /user/` 资料。
- 已登录时顶部右侧显示头像，点击打开菜单：个人主页、退出登录。未登录显示"登录""注册"。退出登录均需在弹出框中确认。
- 登录、注册、个人主页不显示顶部导航栏，左上角 logo 可返回首页。登录与注册内容放在卡片中，并上下左右居中。

### 视觉

- 深色主题（中性灰 + 蓝色强调），配色与变量定义见 `src/assets/main.css`。字体为系统无衬线字体。可点击卡片的悬停反馈为边框变蓝、背景提亮。

### 依赖管理

- 新增第三方依赖需说明理由，避免引入功能重复的库。
- 修改 `vite.config.ts`、`tsconfig.app.json` 等工程配置需同步更新本文档。

---

## 待实现功能

- **个人与他人页面**：用户公开页 `/users/:id`（接口已验证可用）；"我的文章"列表（`query[author]` 已验证可用）。
- **列表与数据量**：专栏列表与编辑页专栏下拉仅取前 100 条；文章评论全部内嵌、无分页。
- **文章封面与图片**：后端支持 `cover` 与图片上传，前端未做；编辑器中的图片仅支持外部地址。
- **未决定事项**：环境变量说明、部署方案。
- **验证**：浏览器端到端测试按 `docs/integration/manual-checklist.md` 逐项进行。

---

## 对接后端

- 接口契约统一维护在 `docs/integration/frontend-handoff.md`，前后端同步更新。
- 接口总览与约定见 `docs/api/api.md`。

---

## 构建与部署

```bash
npm run build
```

构建产物位于 `dist/`，部署方案待定。

---

## 相关文档

- 接口契约：`docs/integration/frontend-handoff.md`
- 接口总览与约定：`docs/api/api.md`
- 联调清单：`docs/integration/manual-checklist.md`
- 后端服务：`../blog-server/README.md`
