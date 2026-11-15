# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
npm install
npm run dev          # Vite 开发服务器；接口地址来自 .env.development 的 VITE_APP_BASE_URL
npm run build        # vue-tsc --build（类型检查）后执行 vite build -> dist/
npm run type-check   # 仅 vue-tsc 类型检查（覆盖 src/ 下全部 .ts/.vue）
npm run build-only   # 仅 vite build，不做类型检查
npm run preview      # 本地预览 dist/
npm run format       # prettier --write src/
```

- Node：`^20.19.0 || >=22.12.0`（见 package.json 的 `engines`）。
- 未配置测试框架与 lint，没有单测命令。验证改动使用 `npm run type-check` 与 `npm run build`。
- 运行前需启动后端 `blog-server`（默认 `http://127.0.0.1:3000`，同级目录 `../blog-server`）。
- `.env.development` 已被 git 跟踪。不要在输出或提交中打印、复制其中的值。当前没有 `.env.production`。

## 工作约定（用户要求）

- **执行前先出方案**：任何修改动手前先给出方案，等用户确认后再执行。只读调研不需要确认。
- **文档同步**：每次修改代码后，同步更新 README.md 与本文件，保持与实际状态一致。
- **本文件用中文撰写**，命令、路径、变量名、代码标识符保持英文。
- **删除操作先保留**：任何删除（文件、目录、资源）都先保留原样，列出清单，等用户确认后再删除。

## 代码库现状

- 技术栈：Vue 3 + TypeScript（`<script setup lang="ts">`）+ Vite 8 + Pinia + Vue Router + Element Plus（按需导入）。
- 前两个里程碑（布局、路由、只读浏览、登录注册、自动登录、头像菜单、个人主页、深色主题）及其后续调整（个人主页独立页面、退出二次确认、登录注册卡片、配色统一）已完成，类型检查与构建通过。
- **运行时仅做了接口层的只读验证**（后端在线）：`GET /index` 未登录返回 401，`GET /user` 未登录返回 401，`GET /keys` 返回 200。**未做浏览器端到端测试**，登录、自动登录、头像菜单、个人主页的页面行为尚未在浏览器中验证。
- 已实现页面：首页（文章列表、搜索、分页）、文章详情（正文与内嵌评论）、专栏列表、专栏详情、个人主页（只读）、登录、注册、404。
- 已删除：`src/views/AboutView.vue`（经用户确认）。
- 待清理（**未删除，需用户确认后再删**）：
  - `src/components/HelloWorld.vue`、`TheWelcome.vue`、`WelcomeItem.vue`、`components/icons/*`：未被引用。
  - `src/stores/counter.ts`：演示代码。
  - `src/assets/base.css`：`main.css` 已不再引入，未被引用。
  - `src/assets/logo.svg`：`App.vue` 已不再引用，未被引用。
- `src/plugins/http.js` 在工作区中已删除（`git status` 显示 `D`），`src/plugins/` 为空目录。
- 服务端契约文档 `docs/integration/frontend-handoff.md` 是接口的权威来源。`docs/api/` 为后端侧参考。
- 项目内 Claude 配置：
  - `.claude/rules/karpathy-guidelines.md`：编码行为准则（先想清楚再动手、最小改动、可验证目标），内容来自上游仓库 `CLAUDE.md`。
  - `.claude/skills/ui-ux-pro-max/`：UI/UX 设计 skill。`SKILL.md` 中脚本路径已改为项目相对路径（`.claude/skills/...`），原版使用插件变量 `${CLAUDE_PLUGIN_ROOT}`。
  - UI-UX 搜索脚本 `scripts/search.py` 已验证可用。解释器：`D:\Program Files\Python314\python.exe`（Python 3.14.6），Git Bash 下为 `/d/Program Files/Python314/python.exe`。

## 架构

### 导入路径

- 项目内一律使用**相对路径**，已移除 `@` 别名（`vite.config.ts` 与 `tsconfig.app.json` 中均已删除）。

### Element Plus 按需导入

- `vite.config.ts` 中通过 `unplugin-auto-import` 与 `unplugin-vue-components` 配合 `ElementPlusResolver` 实现按需导入，样式随组件加载。
- 自动生成文件 `src/auto-imports.d.ts`、`src/components.d.ts` 由插件产生，勿手改。
- 模板中直接使用 `el-*` 组件。**指令（如 `v-loading`）未确认会自动导入，避免使用**，改用 `el-skeleton` 等组件表达加载状态。

### 路由与布局

- `src/router/index.ts` 有两组布局：
  - **主站** `AppLayout`（`src/layouts/AppLayout.vue`，顶部导航 + 右侧头像菜单）：`home`、`article-detail`、`columns`、`column-detail`。
  - **独立页面** `AuthLayout`（`src/layouts/AuthLayout.vue`，无导航栏，仅左上角 logo `src/components/AppBrand.vue` 返回首页）：`login`、`register`（`guestOnly`，路由 meta `centered: true`，内容上下左右居中），以及 `profile`（`/me`，`requiresAuth`，顶部对齐）。
- 未匹配路径进入 `not-found`。
- 页面组件一律懒加载，路径为 `() => import('../views/Xxx.vue')`。
- `router.beforeEach`：`requiresAuth` 未登录 → 登录页（携带 `redirect`）；`guestOnly` 已登录 → 首页。
- 登录后跳转 `redirect`，由 `src/utils/redirect.ts` 的 `safeRedirect` 校验：仅接受以 `/` 开头且非 `//` 的站内路径。

### 登录态与自动登录

- token 保存在 `localStorage`（键 `ua_jot`），用户 id 保存在 `ua_uid`。`useUserStore` 创建时从 `localStorage` 读取 `isLoggedIn`。
- 启动顺序在 `src/main.ts` 中固定：`createPinia` → `restoreSession()` → `app.use(router)` → 注册 401 处理函数 → `mount`。路由守卫因此读取的是校验后的登录态。
- `restoreSession`（`src/utils/session.ts`）：存在 token 时调用 `GET /index` 校验，成功后调用 `refreshProfile()`（`GET /user/`）写入 store。401 由拦截器清除登录态；网络错误时保留登录态，避免离线时误登出。
- 登录、注册成功后同样调用 `refreshProfile()`，失败不阻断登录流程。
- 头像区域：已登录显示头像（无头像用昵称首字），点击弹出下拉菜单（个人主页、退出登录）；未登录显示"登录""注册"按钮。
- 退出登录统一经 `src/utils/logout.ts` 的 `confirmLogout()`：先弹出 `ElMessageBox` 二次确认，确认后调用 `useUserStore().logout()` 清除 token、uid 与资料。头像菜单与个人主页均使用此入口。
- 登录后跳转 `redirect`，由 `src/utils/redirect.ts` 的 `safeRedirect` 校验：仅接受以 `/` 开头且非 `//` 的站内路径。
- 401 处理：`src/api/request.ts` 的响应拦截器对 401 调用 `useUserStore().logout()`，再调用由 `main.ts` 通过 `setUnauthorizedHandler` 注册的处理函数（跳转 `login`，已在登录页则不重复跳转）。注册而非直接 import router，避免循环依赖。
- 启动阶段（`restoreSession`）发生的 401 发生在注册 handler 之前，因此只清除登录态，不跳转。

### 接口调用链路

- 接口表在 `src/config/api.config.ts`：以 `type` 为键，值为 `{ url, method, rsaKey?, rest?, setToken?, noMessage? }`，`ApiType` 由该对象推导。`rsaKey` 可为字符串或字符串数组。
- `/user` 相关接口 url 使用尾斜杠 `/user/`：后端 `/user` 为 Express 路由，无尾斜杠会收到 301 重定向。
- `src/api/index.ts` 导出 `Http<T>({ type, data })`，是唯一入口。流程：
  - `rest: true` 时用 `data` 中的同名字段替换 `url` 末尾的 `:param`，并从请求体/query 中删除该字段；
  - 设置 `rsaKey` 时，对对应字段调用 `encrypt`（在副本上操作，不修改调用方数据）；
  - 使用缓存公钥时遇到 4xx，清除缓存并重试一次；
  - GET 将 `data` 作为 `params`，其余方法作为 `data` 发送；
  - `setToken: true` 时，将 `userId`、`token` 写入 `localStorage`（键 `ua_uid`、`ua_jot`），并调用 `useUserStore().login()`；
  - 出错且未设置 `noMessage` 时，用 `ElNotification` 展示服务端返回的中文 `message`，然后重新抛出。
- `src/api/request.ts` 是 axios 实例：
  - `baseURL` 取自 `VITE_APP_BASE_URL`，超时取 `base.config.ts` 的 `TIMEOUT`；
  - 请求拦截器从 `localStorage` 的 `ua_jot` 读取 token，添加 `Authorization: Bearer <token>`；
  - 响应拦截器不解包数据，统一结构 `{ message, data }` 由 `Http` 解包。
- 服务端统一结构：成功 `{ message, data }`，失败 `{ code, message }`，DELETE 成功为 `{ errMsg: "ok" }`。
- 列表接口返回分页结构 `{ count, page, size, total, pages, display, list }`，类型见 `src/types/api.ts`。

### 页面数据约定

- 类型定义集中在 `src/types/api.ts`（`Pagination`、`ArticleBrief`、`ArticleDetail`、`Comment`、`Column`、`AuthResult` 等），与后端 populate 后的字段对应。
- 首页：关键词为空走 `articles`，否则走 `search`（参数 `query: { q }`）。每页 10 条。
- 文章正文按**纯文本**显示（`white-space: pre-wrap`），不渲染 HTML。若将来引入富文本，必须先做净化（sanitize）。
- 文章详情与专栏详情只在挂载及 `route.params.id` 变化时请求，不在渲染中请求（`GET /api/rest/articles/:id` 每次调用阅读数 +1）。
- 专栏列表与详情中的 `aids` 为 populate 后的文章；专栏详情未做分页，分页行为待用 curl 验证。

### 加密

- `src/utils/encrypt.ts` 使用 WebCrypto：`RSA-OAEP` + `SHA-1`，与服务端一致（见 `docs/integration/frontend-handoff.md`，服务端 `docs/api/api.md` 中为 `pkcs1_oaep`）。**不要改为 SHA-256 或 JSEncrypt。**
- 公钥通过 `GET /keys` 获取，缓存于 `localStorage`（键 `ua_publicKay`）。缓存的公钥被 4xx 拒绝时，`Http` 会清除缓存并重试一次（`clearPublicKey()`）。
- 密码在客户端加密一层，服务端会做第二层。
- 多字段加密：`putUserInfo` 加密 `password`、`oldPassword`；`deleteUser`（`DELETE /user`）加密 `password`。
- `crypto.subtle` 仅在 HTTPS 或 `localhost` 下可用，部署时必须启用 HTTPS。

### 状态与存储

- `src/utils/storage.ts` 是 `localStorage` 薄封装，替代了原先未声明依赖的 `store` 包。
- `src/stores/user.ts`（Pinia setup store `user`）提供 `isLoggedIn`、`uid`、`profile`（`UserProfile`）以及 `login()`、`setProfile()`、`logout()`。
- `src/utils/session.ts` 提供 `refreshProfile()` 与 `restoreSession()`。

### 视觉规范（深色主题）

- 样式集中在 `src/assets/main.css`，使用 `html:root` 覆盖 Element Plus 的 `--el-*` 变量（优先级高于库自带的 `:root` 定义，避免加载顺序影响覆盖）。
- 配色：中性灰 + 蓝色强调。灰阶取自 Element Plus 原生深色主题（背景 `#0a0a0a`，卡片 `#141414`，浮层 `#1d1e1f`，边框 `#4c4d4f`，主文字 `#e5eaf3`），强调色 `#2563EB`。顶部菜单变量 `--el-menu-*` 在 `main.css` 中显式定义。页面中禁止硬编码颜色，统一使用 `var(--el-*)`。
- 字体：系统无衬线字体栈。衬线字体方案已确认**暂不采用**，以后再说。
- 可访问性：键盘焦点使用 `:focus-visible` 的可见轮廓；交互控件最小点击区域 44px（头像触发器、认证按钮）；尊重 `prefers-reduced-motion`。
- 图标使用 Element Plus 组件，不使用 emoji。

### 接口行为注意

- `GET /api/rest/articles/:id` 每次调用阅读数 +1，不要放在渲染或 watch 循环中调用。
- 删除专栏会级联删除他人文章与评论；注销账号同样级联。UI 中必须先弹出确认。
- 分页 `size` 上限为 100，首页使用 10。
- 头像上传要求 `uid` 等于当前用户 id，返回的 URL 需再通过 `PUT /user` 写入。限制：100 KB，仅 jpg/jpeg/png/gif/webp。
- `content` 发送前需 `encodeURIComponent`。

### 配置与表单

- `src/config/form.config.ts`、`modal.config.ts`、`validate.config.ts` 定义表单字段、弹窗按钮与校验规则（校验规则类型为 Element Plus 的 `FormRules`）。登录页、注册页已使用。
- 登录只做必填校验（已有账号的密码可能不符合注册规则）；注册使用 `validate.config.ts` 的完整规则。
- `form.config.ts` 中 `userInfo.signature` 的 `type` 写为 `'txt'`，属于已存在的写法，后续若需要多行输入需统一修正。

## 约定（沿用并更新自 README）

- 组件：仅使用 `<script setup lang="ts">`，禁止 Options API；组件名 PascalCase，文件名与组件名一致；样式用 `<style scoped>`。
- 所有 HTTP 请求经过 `src/api/`，组件中禁止直接调用 axios。
- 不要随意修改 `vite.config.ts` 与 `tsconfig.app.json`；如需修改需同步更新本文件与 README。
- Prettier：无分号、单引号、printWidth 100（`.prettierrc.json`）。
- 界面文案与服务端消息为中文，新增的用户可见文案保持中文。
