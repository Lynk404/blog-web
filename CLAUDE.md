# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
npm install
npm run dev          # Vite 开发服务器；接口地址来自 .env.development 的 VITE_APP_BASE_URL
npm run build        # run-p 并行执行 vue-tsc --build 与 vite build -> dist/
npm run type-check   # 仅 vue-tsc 类型检查（覆盖 src/ 下全部 .ts/.vue）
npm run build-only   # 仅 vite build，不做类型检查
npm run preview      # 本地预览 dist/
npm run format       # prettier --write --experimental-cli src/
```

- Node：`^20.19.0 || >=22.12.0`（见 package.json 的 `engines`）。
- 未配置测试框架与 lint，没有单测命令。验证改动使用 `npm run type-check` 与 `npm run build`。
- 运行前需启动后端 `blog-server`（默认 `http://127.0.0.1:3000`，同级目录 `../blog-server`）：`cd ../blog-server && npm start`。前置条件：MongoDB 运行在 `mongodb://127.0.0.1:27017/db_blog`、`auth/` 下有四个密钥文件、已执行 `node scripts/sync-key.js`（详见 `docs/integration/manual-checklist.md`）。
- `.env.development` 已被 git 跟踪。不要在输出或提交中打印、复制其中的值。当前没有 `.env.production`。

## 工作约定（用户要求）

- **执行前先出方案**：任何修改动手前先给出方案，等用户确认后再执行。只读调研不需要确认。
- **文档同步**：每次修改代码后，同步更新 README.md 与本文件，保持与实际状态一致。
- **本文件用中文撰写**，命令、路径、变量名、代码标识符保持英文。
- **删除操作先保留**：任何删除（文件、目录、资源）都先保留原样，列出清单，等用户确认后再删除。

## 代码库现状

- 技术栈：Vue 3 + TypeScript（`<script setup lang="ts">`）+ Vite 8 + Pinia + Vue Router + Element Plus（按需导入）。
- 已完成：布局与路由、只读浏览、登录注册、自动登录、头像菜单、个人主页（独立页面）、退出二次确认、登录注册卡片与居中、深色主题、三栏首页（左栏专栏、中栏公告轮播与帖子列表、右栏 Yes排行榜）、搜索蒙版页、全屏写帖子页、消息铃铛 UI（本地占位，接口预留），以及写入功能（评论、点赞、发布帖子、新建专栏、编辑资料、头像、改密码、注销），编辑与删除（帖子、评论、专栏，含级联提示），Markdown 编辑与预览（v-md-editor），路由顶部进度条（nprogress）。类型检查与构建通过。
- **接口层已验证**（后端在线）：只读接口与未登录 401 已验证；写接口、编辑与删除接口（含级联）均已用临时账号联调通过，测试脚本在项目外、未入库。
- **部分浏览器验证**（2026-11-16）：用 headless Chrome 实测首页三栏与移动端布局（公告轮播、Yes排行榜、帖子列表面板）、搜索蒙版与结果、专栏页发布按钮、全屏写帖子页及专栏预选；后续补测登录后从左侧新建专栏、全部专栏列表刷新、未登录新建跳转登录、专栏详情选中高亮及移动端布局，以及选中态与悬停态的样式区分。注册流程可用，临时账号已注销。其余流程（自动登录、头像菜单、个人主页、评论增删改、帖子编辑/删除、进度条）仍未做浏览器端到端测试，按 `docs/integration/manual-checklist.md` 检查。
- 已实现页面：首页（三栏：左栏专栏、中栏公告轮播与帖子列表、右栏 Yes排行榜；无搜索栏和写帖子入口）、搜索（`/search` 蒙版覆盖首页，嵌套路由）、发布帖子与编辑帖子（全屏独立布局，登录，`article-create` 与 `article-edit` 复用同一组件，仅本人专栏可发布；封面图可上传、更换、移除）、帖子详情（封面图、Markdown 正文、评论增删改、点赞、发表评论，作者可编辑或删除帖子）、专栏列表（登录后新建专栏；本人专栏显示“发布帖子”）、专栏详情（作者可改名、删除）、个人主页（资料、头像、编辑资料、改密码、注销）、登录、注册、404。
- `src/plugins/` 为空目录。
- `src/style.css` 为模板遗留文件，全项目未引用，待清理（删除前需确认）。
- 服务端契约文档 `docs/integration/frontend-handoff.md` 是接口的权威来源。`docs/api/` 为后端侧参考，与 `../blog-server/docs/api/` 同名同内容（总览为 `api.md`），修改时两边同步；`docs/api` 沿用“文章”指代帖子，与后端模型和字段一致。
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
- **函数式 API**（`ElMessage`、`ElMessageBox`、`ElNotification`）不会自动带上样式，已在 `src/main.ts` 显式引入对应的 `theme-chalk` 样式（message、message-box、notification、overlay）。新增其他函数式 API 时需同样处理，否则弹框无样式、无蒙版。
- 退出登录、注销账号的确认框禁止点击蒙版和 Esc 关闭（`closeOnClickModal: false`、`closeOnPressEscape: false`），弹框期间不允许其他操作。

### 路由与布局

- `src/router/index.ts` 有两组布局：
  - **主站** `AppLayout`（`src/layouts/AppLayout.vue`，顶部仅 logo + 搜索框 + 消息铃铛 + 头像菜单，无首页/专栏菜单）：`home`（`meta.wide: true`，三栏）、其子路由 `search`（搜索蒙版）、`article-detail`、`columns`、`column-detail`（`columns` 与 `column-detail` 也使用 `meta.wide`）。
  - **独立页面** `AuthLayout`（`src/layouts/AuthLayout.vue`，无导航栏，仅左上角 logo `src/components/AppBrand.vue` 返回首页）：`login`、`register`（`guestOnly`，路由 meta `centered: true`，内容上下左右居中），以及 `profile`、`article-create`、`article-edit`（均 `requiresAuth`，顶部对齐；写帖子与编辑页为全屏布局）。
- `search` 作为 `home` 的子路由，使 `HomeView` 在打开搜索时保持挂载，弹窗以蒙版覆盖主页；`HomeView` 内必须保留 `<RouterView />` 出口。
- `AppLayout` 的 `el-main` 根据 `route.meta.wide` 放宽到 1600px；其他主站页面保持 960px。首页网格为 `260px minmax(0, 1fr) 260px`，栏间距 40px，左右等宽使中栏居中；中栏是独立纵向容器（公告轮播 → 帖子列表面板），右栏为 Yes排行榜，左栏与中栏顶部对齐，高度各自随内容，不拉伸。`≤1280px` 隐藏右栏变两栏，`≤820px` 变单栏。
- 顶部搜索框是按钮（不是输入框），点击进入 `search`；真实输入与结果都在蒙版内。
- 未匹配路径进入 `not-found`。

### 专栏页面与共享面板

- `src/components/ColumnSidebar.vue`：左侧专栏列表，首页、全部专栏页、专栏详情页共用。`showCreate` 控制列表末尾的“＋ 新建专栏”虚线项，只有专栏页传 `true`；未登录点击会提示并跳转登录页。新建成功后派发 `created` 事件。专栏详情页按 `route.params.id` 给对应项加 `is-active`（3px 金色左边线、金色渐变底、金色字重 600、`aria-current="page"`），且强于悬停的浅金底；首页与全部专栏页不高亮任何项。
- `src/components/PanelBox.vue`：统一渐变标题栏 + 深色内容面板，`variant` 支持 `purple`（左栏）、`hot`（帖子列表、全部专栏、专栏帖子列表）与 `rank`（Yes排行榜，`#5b4522` 纯色标题栏 + 同色边框）；共享侧栏、首页、专栏页均使用它。
- `src/components/HomeCarousel.vue`：首页公告轮播，3 条本地占位公告，使用 `el-carousel`；桌面 320px、平板 240px、手机 200px，手机隐藏装饰图；`prefers-reduced-motion` 下关闭自动播放。后端公告接口接入后替换 `slides` 数组。
- `/columns` 全部专栏页与 `/columns/:id` 专栏详情页都是「左侧 `ColumnSidebar` + 右侧合并主区」的网格布局（`260px + 1fr`，间距 40px）。
- 专栏详情页顶部为专栏头（图标占位、专栏名、帖子数、本人操作）；下方为 `PanelBox` 帖子列表，行内展示封面缩略图、标题、阅读/评论/点赞、日期。专栏详情接口的 `aids[].author` 是用户 id 字符串而非 populate 后的对象，因此列表不显示作者；接口也不返回摘要，因此不显示摘要文字。
- 页面组件一律懒加载，路径为 `() => import('../views/Xxx.vue')`。
- `router.beforeEach`：`requiresAuth` 未登录 → 登录页（携带 `redirect`）；`guestOnly` 已登录 → 首页。
- 顶部进度条：`beforeEach` 调用 `NProgress.start()`，`afterEach` 与 `onError` 调用 `NProgress.done()`。进度条样式在 `main.css`。
- 登录后跳转 `redirect`，由 `src/utils/redirect.ts` 的 `safeRedirect` 校验：仅接受以 `/` 开头且非 `//` 的站内路径。

### 登录态与自动登录

- token 保存在 `localStorage`（键 `ua_jot`），用户 id 保存在 `ua_uid`。`useUserStore` 创建时从 `localStorage` 读取 `isLoggedIn`。
- 启动顺序在 `src/main.ts` 中固定：`createPinia` → `restoreSession()` → `app.use(router)` → 注册 401 处理函数 → `mount`。路由守卫因此读取的是校验后的登录态。
- `restoreSession`（`src/utils/session.ts`）：存在 token 时调用 `GET /index` 校验，成功后调用 `refreshProfile()`（`GET /user/`）写入 store。401 由拦截器清除登录态；网络错误时保留登录态，避免离线时误登出。
- 登录、注册成功后同样调用 `refreshProfile()`，失败不阻断登录流程。
- 顶部右侧为搜索框 + 头像/认证按钮。已登录显示头像（无头像用昵称首字），点击弹出下拉菜单（个人主页、退出登录）；未登录显示"登录""注册"按钮。搜索框为按钮，点击进入 `search`。
- 退出登录统一经 `src/utils/logout.ts` 的 `confirmLogout()`：先弹出 `ElMessageBox` 二次确认，确认后调用 `useUserStore().logout()` 清除 token、uid 与资料。头像菜单与个人主页均使用此入口。
- 401 处理：`src/api/request.ts` 的响应拦截器对 401 调用 `useUserStore().logout()`，再调用由 `main.ts` 通过 `setUnauthorizedHandler` 注册的处理函数（跳转 `login`，已在登录页则不重复跳转）。注册而非直接 import router，避免循环依赖。
- 启动阶段（`restoreSession`）发生的 401 发生在注册 handler 之前，因此只清除登录态，不跳转。

### 消息按钮（预留）

- `src/components/MessageBell.vue` 位于 `AppLayout` 顶部搜索框与头像之间，仅登录后显示。
- 点击铃铛展开下拉列表；点击条目用 `el-dialog` 蒙版展示标题、时间、正文，交互与搜索蒙版一致。
- **后端消息接口尚未实现**：组件内 `messages` 为本地占位数据，接入接口后替换数据来源；不要把占位数据当作真实消息。

### 接口调用链路

- 接口表在 `src/config/api.config.ts`：以 `type` 为键，值为 `{ url, method, rsaKey?, rest?, setToken?, noMessage? }`，`ApiType` 由该对象推导。`rsaKey` 可为字符串或字符串数组。
- `/user` 相关接口 url 使用尾斜杠 `/user/`：后端 `/user` 为 Express 路由，无尾斜杠会收到 301 重定向。
- `src/api/index.ts` 导出 `Http<T>({ type, data })`，是唯一入口。流程：
  - `rest: true` 时用 `data` 中的同名字段替换 `url` 末尾的 `:param`，并从请求体/query 中删除该字段；
  - 设置 `rsaKey` 时，对对应字段调用 `encrypt`（在副本上操作，不修改调用方数据）；
  - 使用缓存公钥时遇到 4xx，清除缓存并重试一次；
  - GET 将 `data` 作为 `params`，其余方法作为 `data` 发送；`data` 为 `FormData` 时原样发送，不加密（上传）；
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
- 首页为三栏：左栏共享 `ColumnSidebar`（无新建入口）、中栏公告轮播 + 帖子列表（`PanelBox` 包裹）+ 分页、右栏 Yes排行榜。首页不再含搜索栏和写帖子入口。
- Yes排行榜额外请求 `articles`（`page: 1, size: 100`），前端按 `hit_num`、`like_num` 排序取前 5；这是“前 100 篇中的热门”，不是全站热门。`≤1280px` 时右栏隐藏，排行榜不显示。
- 搜索为 `home` 的嵌套路由 `/search`，用 `el-dialog` 覆盖主页。关键词写入 `?q=`，直接访问 `/search?q=...` 可恢复；空关键词不发请求。
- 写帖子/编辑帖子在 `AuthLayout` 下全屏显示，页面主体限宽 960px；`/articles/new?column=<id>` 会在本人专栏中预选该专栏，编辑模式忽略该参数。
- “全部专栏”页在左侧栏末尾提供“新建专栏”。专栏详情页的“发布帖子”“修改专栏名”“删除专栏”只对本人专栏显示；他人专栏不显示发布按钮。后端仍禁止发布到他人专栏（见接口行为注意）。
- 帖子正文为 **Markdown**，由 `src/components/MarkdownPreview.vue`（v-md-editor 预览）渲染。预览内置 xss 过滤，**不得关闭**。编辑器为 `src/components/MarkdownEditor.vue`。两者均为懒加载，只在需要的页面加载。若新增渲染入口，必须经过同一预览组件或同等净化，不得直接 `v-html`。
- 帖子封面在发布/编辑页通过 `POST /upload/article` 上传，返回 `string[]`，取第一个 URL 写入 `cover`；头像与封面共用 `src/config/upload.config.ts` 的 2 MB 限制和格式白名单。首页、搜索结果的帖子卡片与专栏详情列表均为“封面左置、内容右置”，详情页标题下方展示封面。
- v-md-editor 的 github 主题实际容器类名是 `github-markdown-body`（不是 `markdown-body`）；`main.css` 的深色覆盖必须同时覆盖两个类名，尤其要覆盖表格 `tr` 与 `tr:nth-child(2n)` 的白色/浅灰背景，否则正文表格会显示为白底。
- **编辑器内核由调用方注入**：v-md-editor 2.x 不内置 CodeMirror，`MarkdownEditor.vue` 通过组件选项 `Codemirror` 注入 `codemirror`（5.x，已作为直接依赖）。未注入时编辑器内部报 `reading 'doc'` 错误。库默认 `scrollbarStyle: 'overlay'` 需额外插件，这里改为 `native`。
- v-md-editor 的子路径入口（`/lib/codemirror-editor`、`/lib/preview`、`/lib/theme/github.js`）与 `codemirror` 的最小类型声明在 `src/types/md-editor.d.ts`，修改编辑器导入方式时需同步维护。
- 帖子详情与专栏详情只在挂载及 `route.params.id` 变化时请求，不在渲染中请求（`GET /api/rest/articles/:id` 每次调用阅读数 +1）。
- 专栏列表与详情中的 `aids` 为 populate 后的帖子；专栏详情为单条查询，**不分页**，返回全部帖子（已用 `GET /api/rest/columns/:id` 确认）。

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
- `src/utils/confirm.ts` 的 `confirmAction()` 用于删除等危险操作的二次确认，蒙版期间禁止点击蒙版与 Esc 关闭。

### 视觉规范（深色主题）

- 样式集中在 `src/assets/main.css`，使用 `html:root` 覆盖 Element Plus 的 `--el-*` 变量（优先级高于库自带的 `:root` 定义，避免加载顺序影响覆盖）。
- 配色：近黑底 + 金色主强调 + 紫色次强调。背景 `#090909`，卡片/面板 `#1d1d1d`，悬停背景 `#252525`，浮层 `#242424`，边框 `#2f2f35`，主文字 `#f4f4f5`，常规文字 `#d4d4d8`，辅助文字 `#9a9aa3`；金色 `#d4a63a`。左栏标题渐变 `#575659 → #3a2f45`，帖子列表面板标题渐变 `#362a42 → #382812`，Yes排行榜使用 `#5b4522` 纯色标题栏与同色边框。主按钮为金底深色文字。紫色、金色软背景、排行榜银/铜等使用 `main.css` 的 `--app-*` 变量。页面中禁止硬编码颜色，统一使用 `var(--el-*)` 或 `var(--app-*)`。
- 首页栏目头（专栏、帖子列表）使用渐变，Yes排行榜使用 `#5b4522` 纯色；标题前使用 Element Plus 图标（专栏 `Collection`、帖子列表 `Document`、排行榜 `Trophy`），普通标题图标为金色，排行榜标题与图标为深色；标题字号 17px，左栏列表项高度 52px、排行榜 56px，内容字号 15px，辅助信息 13px。排行榜排名前三分别为金、银、铜；搜索框为胶囊形，悬停/聚焦金色边框；消息铃铛背景与搜索框一致（`--app-surface` + 边框），头像悬停金色描边；顶栏高度 72px（移动端 64px）。
- 首页公告轮播使用深紫 `--app-purple-gradient`、深棕 `--app-hot-gradient` 与 `--app-announce-gradient`，指示点激活态为金色；`prefers-reduced-motion` 时关闭自动播放。
- 顶栏使用 `position: sticky` 吸顶，半透明背景 + `backdrop-filter: blur`，底边有模糊光晕和缓慢横向扫光（呼应 Logo）；`prefers-reduced-motion` 时底边恢复静态边框。下拉菜单悬停色由 `main.css` 覆盖 `--el-dropdown-menuItem-hover-fill`（`--app-gold-soft`）与 `--el-dropdown-menuItem-hover-color`（`--el-color-primary-light-3`），避免默认 `primary-light-9` 的近白底导致金字看不清。
- 首页帖子卡片、搜索弹窗结果卡片与专栏详情帖子行悬停时 `translateY(-2px) scale(1.015)`，边框变金、背景提亮；`prefers-reduced-motion: reduce` 时取消位移与缩放。
- Logo 文案为 `Yes论坛`，字号 24px（移动端 20px），主色 `#405a6f`，使用 `--app-logo-*` 变量；文字有渐变扫光、背后有蓝色呼吸光晕，`prefers-reduced-motion` 时关闭动画。`AppBrand` 与首页“全部专栏”链接不使用下划线。
- 字体：系统无衬线字体栈。衬线字体方案已确认**暂不采用**，以后再说。
- 可访问性：键盘焦点使用 `:focus-visible` 的可见轮廓；交互控件最小点击区域 44px（头像触发器、认证按钮）；尊重 `prefers-reduced-motion`。
- 图标使用 Element Plus 组件，不使用 emoji。
- 可点击卡片（`shadow="hover"`）的悬停反馈由 `main.css` 的 `.el-card.is-hover-shadow:hover` 提供（边框金色、背景提亮）。Element Plus 默认悬停阴影在深色背景上几乎不可见，不要依赖它。
- 顶部进度条（nprogress）使用金色，选择器为 `html:root #nprogress .bar`（`main.css`）。Markdown 编辑器与预览的深色覆盖同样在 `main.css`（`.v-md-editor`、`.markdown-body`、工具栏按钮 `.v-md-editor__toolbar-item` 及其 `--active` 状态、下拉菜单 `.v-md-editor__menu`）。**这些选择器必须带 `html:root` 前缀**：库样式在懒加载分包中后加载，同等特异性会被覆盖（曾因此出现白色编辑器背景）。

### 全局第三方脚本（Live2D 看板娘）

- `index.html` 引入 `waifu.css` 与 `public/live2d.js`；`public/live2d.js` 用动态 `import()` 加载 `live2d-widgets@1.0.1` 的 `waifu-tips.js`，再调用 `window.initWidget`。
- 上游项目：<https://github.com/stevenjoezhang/live2d-widget>。
- 资源统一走 `gcore.jsdelivr.net`：`fastly.jsdelivr.net` 会把模型资源重定向到 `raw.githubusercontent.com`，该域名在部分网络下不可达，模型会一直加载、看板娘不显示。模型使用 `fghrsh/live2d_api@1.0.1`。
- 不要把它改成 `src/main.ts` 的静态 import，也不要内联到入口模块：外部 CDN 失败会阻塞应用启动。保持独立 `defer` 脚本，失败只输出 `console.warn`，不影响页面。
- 需要关闭时删除 `index.html` 中的 `waifu.css` 与 `/live2d.js` 两处引用即可；没有 npm 依赖。

### 接口行为注意

- `GET /api/rest/articles/:id` 每次调用阅读数 +1，不要放在渲染或 watch 循环中调用。
- 删除专栏会级联删除他人帖子与评论；注销账号同样级联。UI 中必须先弹出确认。
- 分页 `size` 上限为 100，首页使用 10。
- 头像上传要求 `uid` 等于当前用户 id，返回的 URL 需再通过 `PUT /user` 写入。头像与帖子图片共用后端 `config.maxFileSize`（2 MB），仅 jpg/jpeg/png/gif/webp。帖子封面走 `POST /upload/article`，返回 `{ errno: 0, data: [url] }`，`Http` 解包后为 `string[]`。
- `content` 发送前需 `encodeURIComponent`（仅帖子；服务端对帖子做 `decodeURIComponent`，评论不做此处理）。
- `PUT /user` 可改字段为 `nikname`、`email`、`avatar`、`password`，**不含 `signature`**，个人主页不提供签名编辑。
- 改密码后旧 token 失效存在同秒窗口：签发与改密码在同一秒内的旧 token 仍可能有效（后端 `iat` 精度为秒）。前端改密码成功后立即清除本地登录态。
- 点赞接口后端不做去重，前端仅在帖子详情页内限制成功点赞一次（刷新页面后可再次点击）。该决定已确认保留。
- 帖子编辑（`PUT /api/rest/articles/:id`）只允许修改 `title`、`content`，所属专栏不可改，编辑页的专栏选择为只读。编辑页取数使用列表接口 `GET /api/rest/articles?query[_id]=<id>`，**不使用单条接口**（单条接口会增加阅读数）。
- 服务端对帖子 `content` 的 setter 会把 `"` 替换为 `'`，Markdown 正文中的双引号会变成单引号（后端既有行为）。
- 评论的编辑与删除仅作者可见入口（`PUT`、`DELETE /api/rest/comments/:id`，后端 403 或 400 校验）。
- 发布帖子只能选本人专栏（列表按 `uid` 筛选，取前 100 条）；他人专栏返回 403。后端 `blog-server/routes/bus.js` 会校验 `req._id === column.uid`，因此前端只在本人专栏显示“发布帖子”。若要让所有人在任意专栏发帖，必须修改后端，并接受专栏删除/作者注销时级联删除他人帖子的风险。

### 配置与表单

- `src/config/form.config.ts`、`modal.config.ts`、`validate.config.ts` 定义表单字段、弹窗按钮与校验规则（校验规则类型为 Element Plus 的 `FormRules`）。登录页、注册页已使用。
- 登录只做必填校验（已有账号的密码可能不符合注册规则）；注册使用 `validate.config.ts` 的完整规则。编辑资料使用其中的 `nikname` 与 `email` 规则。
- `form.config.ts` 中 `userInfo.signature` 的 `type` 写为 `'txt'`，属于已存在的写法，后续若需要多行输入需统一修正。

## 待实现功能

- **个人与他人页面**：
  - "我的帖子"列表：`GET /api/rest/articles?query[author]=<uid>` 已验证可用（返回 23 篇）。
  - 用户公开页 `/users/:id`：`GET /api/rest/users/:id` 已验证可用（仅返回 `nikname`、`avatar`、`signature`），帖子作者名可点击进入。
- **列表与数据量**：
  - **首页中栏懒加载**：当前一次性请求当前页 10 条；后续改为滚动或分页懒加载（用户要求先记录，暂不实现）。
  - 专栏列表只取前 100 条，发布页与编辑页的专栏下拉受此限制，需要分页或搜索。
  - 帖子评论全部内嵌在详情接口中，无分页；评论多时需要后端或前端方案。
- **帖子图片**：封面已支持上传（2 MB，jpg/png/gif/webp）；编辑器正文中的图片目前只能使用外部地址的 Markdown 语法。
- **消息中心**：后端接口未实现；`MessageBell.vue` 已用本地占位数据完成下拉列表与内容蒙版，接入后替换数据源。
- **在他人专栏发帖**：当前后端禁止（403）。如需支持，需要修改 `blog-server/routes/bus.js` 的归属校验，并接受级联删除风险。
- **未决定事项**：环境变量说明、部署方案、衬线字体（已确认暂缓）。
- **验证**：浏览器端到端测试尚未做，按 `docs/integration/manual-checklist.md` 逐项走，重点是第 4 至 7 节。

## 约定（沿用并更新自 README）

- 组件：仅使用 `<script setup lang="ts">`，禁止 Options API；组件名 PascalCase，文件名与组件名一致；样式用 `<style scoped>`。
- 同一逻辑在两个及以上页面复用时，抽取为 `src/composables/useXxx.ts`（目前尚无该目录）。
- 所有 HTTP 请求经过 `src/api/`，组件中禁止直接调用 axios。
- 不要随意修改 `vite.config.ts` 与 `tsconfig.app.json`；如需修改需同步更新本文件与 README。
- Prettier：无分号、单引号、printWidth 100（`.prettierrc.json`）。
- 界面文案与服务端消息为中文，新增的用户可见文案保持中文。
