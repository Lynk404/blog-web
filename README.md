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
| nprogress | ^0.2.0 | 路由切换进度条 |
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
│   │   ├── request.ts         # axios 实例与拦截器（Token 注入、401 清除 Token）
│   │   └── index.ts           # 统一请求入口 Http()，所有接口经此调用
│   ├── assets/                # 参与构建的静态资源
│   ├── components/            # 跨页面复用组件
│   ├── config/                # 接口表、基础配置、表单与弹窗、校验规则
│   ├── router/                # 路由配置
│   ├── stores/                # Pinia 状态（user.ts）
│   ├── utils/                 # 工具函数：storage（localStorage 封装）、encrypt（RSA 加密）
│   ├── views/                 # 页面级组件
│   ├── auto-imports.d.ts      # 自动生成（unplugin-auto-import），勿手改
│   ├── components.d.ts        # 自动生成（unplugin-vue-components），勿手改
│   ├── App.vue
│   ├── main.ts
│   └── style.css
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
| `npm run build` | 类型检查（`vue-tsc --build`）后执行生产构建，产物输出到 `dist/` |
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
- 样式使用 `<style scoped>`，全局样式放在 `src/style.css` 或 `src/assets/`。
- Element Plus 组件通过 `unplugin-vue-components` 按需自动导入，模板中直接使用即可，无需手动 import。
- 同一逻辑在两个及以上页面复用时，抽取为 `composables/useXxx.ts`。

### 导入路径

- 项目内导入一律使用**相对路径**，不使用 `@` 别名（已移除）。

### API 请求

- **所有请求必须经过 `src/api/`，组件中禁止直接调用 axios。**
- 接口在 `src/config/api.config.ts` 中以 `type` 命名登记（`url`、`method`、`rsaKey`、`rest`、`setToken`、`noMessage`）。
- 调用方式：`Http({ type, data })`，定义于 `src/api/index.ts`。
- `src/api/request.ts` 统一处理 `baseURL`、Token 注入（`Authorization: Bearer`）与 401 时清除 Token。

### 敏感数据加密

- 密码等字段通过 `src/utils/encrypt.ts` 加密（WebCrypto，RSA-OAEP + SHA-1），组件中只调用该工具，不自行实现加密。
- 公钥由 `GET /keys` 获取并缓存于 `localStorage`，不要硬编码在业务代码中。缓存失效时自动重新获取并重试一次。
- 需要加密的接口在 `src/config/api.config.ts` 中用 `rsaKey` 声明，支持单个字段或字段数组。
- `crypto.subtle` 仅在 HTTPS 或 `localhost` 下可用，部署时必须启用 HTTPS。

### 路由

- 路由配置集中在 `src/router/index.ts`。
- 非首页页面使用懒加载：`component: () => import('../views/Xxx.vue')`。

### 依赖管理

- 新增第三方依赖需说明理由，避免引入功能重复的库。
- 修改 `vite.config.ts`、`tsconfig.app.json` 等工程配置需同步更新本文档。

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
