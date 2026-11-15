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
- 已迁移为 TypeScript 的目录：`src/api/`、`src/config/`、`src/utils/`、`src/stores/`。
- 路由仅有 `/`（HomeView，仍渲染模板自带的 `TheWelcome`）与 `/about`。`App.vue` 仍包含 `HelloWorld` 模板样板。
- 演示代码尚未清理（待用户确认删除）：`src/stores/counter.ts`、`components/HelloWorld.vue`、`TheWelcome.vue`、`WelcomeItem.vue`、`components/icons/*`、`views/AboutView.vue`。
- `assets/logo.svg` 仍被 `App.vue` 模板头部引用，暂未删除。`base.css`、`main.css` 保留。
- 已删除：空文件 `src/util/auth.js`（迁移时已重命名，后续占位 `utils/auth.ts` 也已删除）、模板图片 `assets/hero.png`、`vite.svg`、`vue.svg`。
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
- 模板中直接使用 `el-*` 组件；在 `.ts` 中调用 API（如 `ElNotification`）也会自动导入，但 `src/api/index.ts` 中显式导入以便阅读。

### 接口调用链路

- 接口表在 `src/config/api.config.ts`：以 `type` 为键，值为 `{ url, method, rsaKey?, rest?, setToken?, noMessage? }`，`ApiType` 由该对象推导。
- `src/api/index.ts` 导出 `Http<T>({ type, data })`，是唯一入口。流程：
  - `rest: true` 时用 `data` 中的同名字段替换 `url` 末尾的 `:param`；
  - 设置 `rsaKey` 时，对该字段调用 `encrypt`；
  - GET 将 `data` 作为 `params`，其余方法作为 `data` 发送；
  - `setToken: true` 时，将 `userId`、`token` 写入 `localStorage`（键 `ua_uid`、`ua_jot`），并调用 `useUserStore().login()`；
  - 出错且未设置 `noMessage` 时，用 `ElNotification` 展示服务端返回的中文 `message`，然后重新抛出。
- `src/api/request.ts` 是 axios 实例：
  - `baseURL` 取自 `VITE_APP_BASE_URL`，超时取 `base.config.ts` 的 `TIMEOUT`；
  - 请求拦截器从 `localStorage` 的 `ua_jot` 读取 token，添加 `Authorization: Bearer <token>`；
  - 响应拦截器不做处理，统一结构 `{ message, data }` 由 `Http` 解包；
  - 响应 401 时清除 token。**跳转登录页尚未实现**（项目目前没有登录页与路由守卫）。
- 服务端统一结构：成功 `{ message, data }`，失败 `{ code, message }`，DELETE 成功为 `{ errMsg: "ok" }`。

### 加密

- `src/utils/encrypt.ts` 使用 WebCrypto：`RSA-OAEP` + `SHA-1`，与服务端一致（见 `docs/integration/frontend-handoff.md`，服务端 `docs/api/api.md` 中为 `pkcs1_oaep`）。**不要改为 SHA-256 或 JSEncrypt。**
- 公钥通过 `GET /keys` 获取，缓存于 `localStorage`（键 `ua_publicKay`）。
- 密码在客户端加密一层，服务端会做第二层。

### 状态与存储

- `src/utils/storage.ts` 是 `localStorage` 薄封装，替代了原先未声明依赖的 `store` 包。
- `src/stores/user.ts`（Pinia setup store `user`）提供 `isLoggedIn`、`uid`、`login()`、`logout()`。
- `src/stores/counter.ts` 为演示代码。

### 接口行为注意

- `GET /api/rest/articles/:id` 每次调用阅读数 +1，不要放在渲染或 watch 循环中调用。
- 删除专栏会级联删除他人文章与评论；注销账号同样级联。UI 中必须先弹出确认。
- 分页 `size` 上限为 100。
- 头像上传要求 `uid` 等于当前用户 id，返回的 URL 需再通过 `PUT /user` 写入。限制：100 KB，仅 jpg/jpeg/png/gif/webp。
- `content` 发送前需 `encodeURIComponent`。

### 配置与表单

- `src/config/form.config.ts`、`modal.config.ts`、`validate.config.ts` 定义表单字段、弹窗按钮与校验规则（校验规则类型为 Element Plus 的 `FormRules`）。
- `form.config.ts` 中 `userInfo.signature` 的 `type` 写为 `'txt'`，与 `text`/`password` 并列，属于已存在的写法，后续若需要多行输入需统一修正。

## 约定（沿用并更新自 README）

- 组件：仅使用 `<script setup lang="ts">`，禁止 Options API；组件名 PascalCase，文件名与组件名一致；样式用 `<style scoped>`。
- 所有 HTTP 请求经过 `src/api/`，组件中禁止直接调用 axios。
- 路由懒加载：`component: () => import('../views/Xxx.vue')`（相对路径）。
- 不要随意修改 `vite.config.ts` 与 `tsconfig.app.json`；如需修改需同步更新本文件与 README。
- Prettier：无分号、单引号、printWidth 100（`.prettierrc.json`）。
- 界面文案与服务端消息为中文，新增的用户可见文案保持中文。
