# Yes论坛（YesForum） · 前端（blog-web）

Yes论坛前端应用，基于 Vue 3 + Vite + TypeScript 构建，对接 `blog-server` 后端服务。

---

## 技术栈

| 技术 | 版本（package.json） | 说明 |
| --- | --- | --- |
| Vue | ^3.5.32 | 前端框架（Composition API + `<script setup>`） |
| Vue Router | ^5.0.4 | 路由管理 |
| Pinia | ^3.0.4 | 状态管理 |
| Element Plus | ^2.14.8 | UI 组件库，按需导入 |
| @element-plus/icons-vue | ^2.3.2 | Element Plus 官方图标包（消息铃铛等） |
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
├── public/                    # 静态资源（原样拷贝到构建产物；live2d.js 为看板娘初始化脚本）
├── src/
│   ├── api/
│   │   ├── request.ts         # axios 实例与拦截器（Token 注入、401 清除登录态并触发跳转）
│   │   └── index.ts           # 统一请求入口 Http()，所有接口经此调用
│   ├── assets/                # 参与构建的静态资源（main.css 为全局样式）
│   ├── components/            # AppBrand.vue（logo）、MessageBell.vue（消息铃铛，接口预留）、HomeCarousel.vue（首页公告轮播，占位内容）、ColumnSidebar.vue（共享专栏侧栏）、PanelBox.vue（渐变面板）、MarkdownEditor.vue / MarkdownPreview.vue（v-md-editor 封装）、profile/（编辑资料、修改密码、注销账号弹窗）
│   ├── config/                # 接口表、基础配置、表单与弹窗、校验规则
│   ├── layouts/               # AppLayout.vue（顶部导航：搜索、消息铃铛、头像菜单）、AuthLayout.vue（登录、注册、个人主页，无导航）
│   ├── router/                # 路由配置与守卫
│   ├── stores/                # Pinia 状态（user.ts）
│   ├── types/                 # 接口数据类型（api.ts）、md-editor.d.ts（v-md-editor 类型声明）
│   ├── utils/                 # storage（localStorage 封装）、encrypt（RSA 加密）、redirect（跳转校验）、session（自动登录与资料）、logout（退出确认）、confirm（危险操作二次确认）
│   ├── views/                 # 页面：首页、帖子详情与发布、专栏列表/详情、个人主页、登录、注册、404
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

| 变量 | 用途 | 说明 |
| --- | --- | --- |
| `VITE_APP_BASE_URL` | axios 的 `baseURL`，后端接口基础地址 | 开发环境在 `.env.development` 中配置；该文件已被 git 跟踪，具体值不在文档中展开 |
| `VITE_APP_FILE_UPLOAD_PATH` | 预留的上传路径变量 | 目前 `src/` 未引用，保留声明 |

当前没有 `.env.production`；部署前需补充生产环境的后端地址。

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

- 路由配置集中在 `src/router/index.ts`。主站页面挂载在 `AppLayout`（顶部为 logo、搜索框、消息铃铛、头像菜单）下；登录、注册、个人主页、写帖子/编辑帖子挂载在 `AuthLayout`（无导航）下，未匹配路径进入 404 页面。
- 首页使用 `meta.wide: true`，主区域放宽到 1600px；其他主站页面保持 960px。首页三栏比例为 `260px minmax(0, 1fr) 260px`，栏间距 40px，左右等宽使中栏居中；中栏为独立纵向容器（公告轮播 → 帖子列表面板），右栏为“Yes排行榜”，左栏与中栏顶部对齐，高度各自随内容，不拉伸。`≤1280px` 隐藏右栏，`≤820px` 变单栏。
- `/columns` 全部专栏页与 `/columns/:id` 专栏详情页同样使用 `meta.wide`，布局为「左侧共享 `ColumnSidebar` + 右侧合并主区」，比例 `260px + 1fr`，间距 40px。新建专栏入口只在专栏页的左侧栏末尾显示。专栏详情页会在左侧栏高亮当前专栏（3px 金色左边线 + 金色渐变底 + 金色字），与鼠标移入的浅金底区分。
- 搜索页 `/search` 是首页的嵌套子路由，`HomeView` 保持挂载，搜索弹窗以蒙版覆盖主页；关键词写入 `?q=`。
- 页面组件使用懒加载：`component: () => import('../views/Xxx.vue')`。
- `meta.requiresAuth` 标记需登录页面（发布/编辑帖子、个人主页），`meta.guestOnly` 标记仅未登录可访问的页面（登录、注册），`meta.centered` 标记认证布局中内容需上下居中的页面（登录、注册）。守卫在 `router.beforeEach` 中处理。
- 登录后的跳转地址经 `src/utils/redirect.ts` 的 `safeRedirect` 校验，仅允许站内路径。
- 每次路由跳转由 `router.beforeEach` 启动顶部进度条（nprogress），`afterEach` 与 `onError` 结束。

### 已实现页面

| 路径 | 页面 | 说明 |
| --- | --- | --- |
| `/` | 首页 | 三栏布局：左栏专栏列表、中栏公告轮播 + 帖子列表面板与分页（每页 10 条，封面左置）、右栏 Yes排行榜；无搜索栏和写帖子入口 |
| `/search` | 搜索 | 首页嵌套路由，搜索弹窗以蒙版覆盖主页；关键词写入 `?q=`；结果卡片封面左置 |
| `/articles/new` | 发布帖子 | 需登录，全屏独立布局。标题、封面图（可选，本地上传）、正文、专栏（仅本人专栏）；支持 `?column=<id>` 预选专栏；正文发送前编码 |
| `/articles/:id` | 帖子详情 | 封面图、Markdown 正文（xss 过滤）、评论；登录后可点赞（本页限一次）、发表评论；作者可编辑、删除帖子；作者可编辑、删除自己的评论 |
| `/articles/:id/edit` | 编辑帖子 | 需登录，仅作者，全屏独立布局。Markdown 编辑；封面可更换或移除；专栏只读（后端不允许修改所属专栏） |
| `/columns` | 全部专栏 | 左侧共享专栏侧栏（末尾“新建专栏”）；右侧上方为“全部专栏”，下方用渐变面板列出全部专栏及帖子数 |
| `/columns/:id` | 专栏详情 | 左侧共享专栏侧栏；右侧上方为专栏头（本人显示发布/修改/删除），下方为渐变面板帖子列表（封面、标题、统计、日期） |
| `/me` | 个人主页 | 需登录，独立页面（无导航栏）。展示资料与统计；更换头像、编辑资料（昵称、邮箱）、修改密码、注销账号（均需确认）；退出登录 |
| `/login` | 登录 | 独立页面，无导航栏，仅做必填校验 |
| `/register` | 注册 | 独立页面，使用 `validate.config.ts` 完整规则 |
| 其他 | 404 | |

### 登录与自动登录

- 登录态保存在 `localStorage`（token 键 `ua_jot`），刷新页面后自动恢复：启动时调用 `GET /index` 校验，通过后拉取 `GET /user/` 资料。
- 顶部右侧为搜索框、消息铃铛与头像菜单；未登录时显示搜索框与"登录""注册"按钮。点击头像打开菜单：个人主页、退出登录。退出登录均需在弹出框中确认。
- 消息铃铛仅登录后显示，点击展开消息下拉列表，点击条目用蒙版弹窗查看内容。**后端消息接口尚未实现**，当前为本地占位数据。
- 登录、注册、个人主页、写帖子页不显示顶部导航栏，左上角 logo 可返回首页。登录与注册内容放在卡片中，并上下左右居中。

### 视觉

- 深色主题（近黑底 `#090909` + 金色主强调 + 紫色次强调），卡片背景 `#1d1d1d`，配色与变量定义见 `src/assets/main.css`。字体为系统无衬线字体。左栏标题渐变 `#575659 → #3a2f45`，帖子列表面板标题渐变 `#362a42 → #382812`，Yes排行榜使用 `#5b4522` 纯色标题栏与同色边框；栏目标题前使用 Element Plus 图标（专栏 `Collection`、帖子列表 `Document`、Yes排行榜 `Trophy`），标题 17px、内容 15px；Yes排行榜前三名为金/银/铜，搜索框为胶囊形，消息铃铛背景与搜索框一致。
- 首页顶部为公告轮播（占位内容）：桌面高 320px、平板 240px、手机 200px，深紫/深棕渐变背景，左右箭头悬停显示，底部金色指示点；`prefers-reduced-motion` 下停止自动播放，手机端隐藏右侧装饰图。
- 首页、搜索结果与专栏详情列表均采用“封面左置、内容右置”的帖子行；首页封面 160×96（移动端 112×72），无封面时显示文档占位图标，详情页标题下方展示封面大图。
- 顶栏吸附在页面顶部，半透明背景 + 背景模糊；底边带模糊光晕与缓慢扫光，`prefers-reduced-motion` 下恢复静态边框。首页帖子卡片、搜索弹窗结果卡片与专栏详情帖子行悬停时均为金色边框、背景提亮并轻微放大；`prefers-reduced-motion` 下取消放大。消息铃铛与头像下拉菜单的条目悬停为深金底 + 浅金字，不使用 Element Plus 默认的近白底。
- Logo 为“Yes论坛”，主色 `#405a6f`，带渐变扫光与背后光晕动画；`prefers-reduced-motion` 下静止。Logo 与“全部专栏”链接无下划线。
- Markdown 预览使用 v-md-editor 的 github 主题，容器类为 `github-markdown-body`；深色覆盖同时适配 `.markdown-body` 与该类，表格、代码块、链接、标题边框均为深色。

### 看板娘（Live2D）

- 全局挂载：`index.html` 引入 `waifu.css` 与 `public/live2d.js`，初始化脚本动态加载 `waifu-tips.js` 和模型。
- 上游项目：[stevenjoezhang/live2d-widget](https://github.com/stevenjoezhang/live2d-widget)。
- 使用 `live2d-widgets@1.0.1`，通过 `gcore.jsdelivr.net` 引入；模型来自 `fghrsh/live2d_api@1.0.1`。
- 不使用默认的 `fastly.jsdelivr.net`：它会把模型资源重定向到 `raw.githubusercontent.com`，部分网络下不可达，模型会一直加载、看板娘不显示。
- 模型与脚本均为外部资源，需要联网；加载失败只在控制台提示，不阻塞应用。移除 `index.html` 中的样式和脚本即可关闭。
- 默认模型为 Potion-Maker 的 Pio，工具菜单包含一言、切换模型/材质、拍照、信息、退出。

### 依赖管理

- 新增第三方依赖需说明理由，避免引入功能重复的库。
- 修改 `vite.config.ts`、`tsconfig.app.json` 等工程配置需同步更新本文档。

---

## 待实现功能

- **个人与他人页面**：用户公开页 `/users/:id`（接口已验证可用）；"我的帖子"列表（`query[author]` 已验证可用）。
- **列表与数据量**：首页中栏后续改为懒加载（当前一次性请求当前页 10 条，先记录、暂不实现）；专栏列表与编辑页专栏下拉仅取前 100 条；帖子评论全部内嵌、无分页。
- **帖子图片**：帖子封面已支持上传（`POST /upload/article`，jpg/png/gif/webp，不超过 2 MB），头像同样为 2 MB；编辑器正文中的图片仍只支持外部地址。
- **消息中心**：后端消息接口未实现；`MessageBell.vue` 已用本地占位数据完成下拉列表与内容蒙版，接入后替换数据源。
- **在他人专栏发帖**：后端 `routes/bus.js` 校验 `req._id === column.uid`，他人专栏返回 403；前端只在本人专栏显示“发布帖子”。如需支持，需要修改后端并接受级联删除风险。
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

## 文档地图

| 文档 | 内容 | 主要读者 |
| --- | --- | --- |
| [README.md](README.md) | 技术栈、启动、脚本、页面、开发规范 | 前端开发者 |
| [CLAUDE.md](CLAUDE.md) | 架构细节、接口行为、维护约定 | 维护者 / AI agent |
| [docs/api/api.md](docs/api/api.md) | 后端接口总览、鉴权、响应格式 | 前后端 |
| [docs/integration/frontend-handoff.md](docs/integration/frontend-handoff.md) | 前后端接口契约与联调顺序 | 前端 |
| [docs/integration/manual-checklist.md](docs/integration/manual-checklist.md) | 浏览器手工联调清单 | 测试 |
| [../blog-server/README.md](../blog-server/README.md) | 后端启动、部署与数据说明 | 后端 |

> `docs/api/` 与 `../blog-server/docs/api/` 保持同名同内容；修改接口文档时两边同步。
