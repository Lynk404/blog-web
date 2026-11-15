# 前后端对接说明（给前端）

Written for: 前端开发（含前端 agent），不熟悉本项目后端实现，需要按本文档调用接口。

## 1. 基本信息

- 后端地址：`http://127.0.0.1:3000`（可用环境变量 `PORT` 改端口，前端请求地址应做成可配置）
- 数据格式：JSON。上传接口用 `multipart/form-data`。
- 跨域：后端当前允许任意来源并携带凭据（`credentials: true`），本地开发无需额外配置。
- 请求头：需要登录的接口带 `Authorization: Bearer <token>`。

## 2. 响应格式

成功：`{ "message": "...", "data": ... }`
失败：`{ "code": <HTTP 状态码>, "message": "<中文原因>" }`

注意两个例外：
- `DELETE` 资源接口成功时返回 `{ "errMsg": "ok" }`，没有 `message` 字段，不要依赖它。
- 错误的 `message` 是给用户看的中文文本，可以直接展示。

## 3. 密码加密（必须先做，否则登录和注册全部失败）

服务端只接受 **RSA-OAEP + SHA-1** 加密的密文。`SHA-256` 会解密失败。

步骤：

1. 调 `GET /keys`，取 `data.pubKey`（PEM 格式的公钥字符串）。失败返回 404 表示服务端公钥未初始化，不要继续登录。
2. 用 WebCrypto 加密明文密码，密文转 base64 字符串：

```js
// pem 为 data.pubKey
const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
const der = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
const key = await crypto.subtle.importKey(
  'spki', der,
  { name: 'RSA-OAEP', hash: 'SHA-1' },   // hash 必须是 SHA-1
  false, ['encrypt']
)
const buf = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, new TextEncoder().encode(password))
const cipher = btoa(String.fromCharCode(...new Uint8Array(buf)))  // 2048 位密钥，结果约 344 字符
```

3. 把 `cipher` 放进请求体的 `password` 字段（或 `oldPassword`）。**只需加密一层**，服务端会自己做第二层。
4. 公钥每次启动前端时取一次即可；换密钥后服务端会提示登录失败，需要重新获取公钥。

## 4. 输入规则（前端先校验，服务端也会校验）

| 字段 | 规则（明文） |
| --- | --- |
| 用户名 `username` | 6–8 位，只含字母和数字，不能全是数字，不能全是字母 |
| 密码 `password` | 8–12 位，必须同时含小写字母、大写字母、数字；可用字符 `a-zA-Z0-9!.#*?&` |
| 邮箱 `email` | 标准邮箱格式，唯一 |
| 昵称 `nikname` | 1–8 位，数字、英文、汉字 |
| 专栏名 `name` | 必填，唯一 |
| 文章 `title`、`content`、`column` | 必填 |
| 评论 `content`、`aid` | 必填 |

## 5. 接口清单

### 5.1 免登录

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/keys` | 返回 `data.pubKey` |
| POST | `/admin/register` | 注册，返回 token（见 5.2） |
| POST | `/admin/login` | 登录，返回 token（见 5.2） |
| GET | `/api/rest/articles` | 文章列表 |
| GET | `/api/rest/articles/:id` | 文章详情（**每调用一次阅读数 +1**） |
| GET | `/api/rest/columns` | 专栏列表 |
| GET | `/api/rest/columns/:id` | 专栏详情（含文章列表） |
| GET | `/api/rest/comments` | 评论列表 |
| GET | `/api/rest/comments/:id` | 评论详情 |
| GET | `/api/rest/users` | 用户公开信息（只返回 `_id`、`nikname`、`avatar`、`signature`） |
| GET | `/api/rest/users/:id` | 同上 |
| GET | `/articles/search` | 搜索文章，必须带 `query[q]` |

### 5.2 注册与登录

**注册** `POST /admin/register`

请求体：`{ username, password(密文), email, nikname?, avatar? }`

成功：`200`，`data: { userId, token }`（注册后直接可用，无需再登录）。

常见错误：`422` `用户名不能重复` / `邮箱不能重复` / 各字段格式提示。

**登录** `POST /admin/login`

请求体：`{ username, password(密文) }`

成功：`200`，`data: { userId, token }`。

常见错误：`422` `用户不存在`、`账号密码错误`。

**token**：有效期 3 天。收到 `401` 时清除本地 token，引导重新登录。

**校验 token** `GET /index` → `200 { message: 'ok' }`，无效返回 `401`。

### 5.3 当前用户 `/user`（需登录）

| 方法 | 说明 |
| --- | --- |
| GET `/user` | 返回本人信息，含 `articleCount`、`columnCount`。不返回密码。 |
| PUT `/user` | 修改资料。可改字段：`nikname`、`email`、`avatar`、`password`。修改密码时必须同时带 `oldPassword`（密文）。 |
| DELETE `/user` | 注销账号，需要 `password`（当前密码，密文）。 |

- 修改密码成功后，**旧 token 应视为失效**，前端需要跳转到登录页重新登录。
- 注销会级联删除该用户的专栏、文章，以及**别人在他的专栏里发的文章**、**别人在他文章下的评论**。注销前必须提示用户。

### 5.4 内容的增删改（需登录）

| 操作 | 方法与路径 | 请求体 | 权限 |
| --- | --- | --- | --- |
| 发文章 | POST `/api/rest/articles` | `{ title, content, column, cover? }` | `column` 必须是本人的专栏，否则 `403`；不存在的专栏 ID 为 `422`，格式不合法的 ID 为 `404` |
| 改文章 | PUT `/api/rest/articles/:id` | `{ title?, cover?, content? }` | 仅作者，否则 `400` |
| 删文章 | DELETE `/api/rest/articles/:id` | — | 仅作者，否则 `403`。会同时删除该文章的所有评论 |
| 建专栏 | POST `/api/rest/columns` | `{ name }` | — |
| 改专栏 | PUT `/api/rest/columns/:id` | `{ name }` | 仅作者，否则 `400` |
| 删专栏 | DELETE `/api/rest/columns/:id` | — | 仅作者，否则 `403`。**会级联删除该专栏下所有文章（包括别人的）及其评论**，删除前必须提示 |
| 发评论 | POST `/api/rest/comments` | `{ content, aid }` | `aid` 必须是已存在的文章：不存在为 `422`，格式不合法的 ID 为 `404` |
| 改评论 | PUT `/api/rest/comments/:id` | `{ content }` | 仅作者，否则 `400` |
| 删评论 | DELETE `/api/rest/comments/:id` | — | 仅作者，否则 `403` |
| 点赞 | POST `/articles/likes/:id` | — | 需登录，未登录 `401`。不做重复点赞限制 |

创建成功返回 `data: { id }`。

**富文本内容**：`content` 发送前用 `encodeURIComponent` 编码，服务端会解码。

### 5.5 上传（需登录）

| 路径 | 用途 | 请求 | 成功响应 |
| --- | --- | --- | --- |
| POST `/upload/user` | 头像 | `file`、`uid`（必填，必须等于当前登录用户的 id；缺失返回 422，不是本人返回 403） | `{ message, data: { fileURL } }` |
| POST `/upload/article` | 文章图片 | `file` | `{ errno: 0, data: [url] }` |

- 只允许 `.jpg`、`.jpeg`、`.png`、`.gif`、`.webp`，其他返回 `422`。
- 单文件最大 100 KB（102400 字节），超出返回 `422`。
- 头像上传的 `uid` 必须是当前登录用户的 id，否则被拒绝，不会留下文件。
- 头像上传后，还需调用 `PUT /user` 把 `fileURL` 写入 `avatar`。
- 上传返回的地址是 `http://127.0.0.1:3000/...`，只在本地可访问。

### 5.6 列表查询参数

`GET /api/rest/:resource` 与 `GET /articles/search` 支持：

- `page`：从 1 开始，默认 1
- `size`：默认 100，**上限 100**，超出按 100 处理
- `query[column]=<专栏id>`：按专栏筛选文章
- `query[q]=<关键字>`：标题和正文模糊搜索
- `GET /api/rest/:resource` 的 `query` 中不允许 `$` 开头的键（如 `query[$where]`），否则 `400`。`GET /articles/search` 不返回 400，这些键会被忽略，只按 `query[q]` 搜索

返回：`data: { count, page, size, total, list, pages, display }`

## 6. 数据结构要点

- 所有 `_id` 为 24 位十六进制字符串。
- `date` 字段返回的是格式化字符串，形如 `2026年11月12日 16:26:00`，直接展示即可。
- 文章列表和详情会附带作者的 `nikname`、`avatar`，以及专栏的 `name`，评论列表会附带评论者的 `nikname`、`avatar`。

## 7. 状态码速查

| 码 | 含义 | 前端处理 |
| --- | --- | --- |
| 200 | 成功 | — |
| 400 | 请求不合法（如非作者改文章、无可修改字段） | 展示 `message` |
| 401 | 未登录、token 无效或过期、修改密码后 token 失效 | 清 token，跳登录 |
| 403 | 无权删除、挂到他人专栏，或上传他人头像（`uid` 不是本人） | 展示 `message` |
| 404 | 资源不存在（ID 格式错误也是 404） | 展示"不存在" |
| 422 | 字段校验失败、重复、文件超限或类型不对 | 展示 `message` |
| 500 | 服务器错误 | 展示通用错误，不要展示原始 `message`。注意：当前 500 响应**没有 `code` 字段**，`message` 是服务端原始报错文本（尚未脱敏），前端不要依赖它的内容 |

注意：没有 token 访问**任何不存在的路径**，也会返回 `401`，不会返回 `404`。

## 8. 已知问题（前端需要知道）

1. **修改密码或注销后，旧 token 统一返回 `401`。** 包括 `GET /user`、写入口（发布、评论、点赞、上传）和修改删除接口。修改密码后前端仍应清除本地 token 并重新登录。（此前的缺陷已修复，见 2026-11-12 的回归用例。）
2. **删除接口的响应没有 `message`**，见第 2 节。
3. **详情接口会增加阅读数。** 同一页面不要重复请求文章详情（例如 React StrictMode 下的双重 effect），否则阅读数会虚高。
4. **点赞没有去重**，同一用户可以无限次点赞，前端如需限制需自行做。

## 9. 联调建议顺序

1. `GET /keys` 能拿到公钥。
2. 注册一个临时账号，拿到 token。
3. `GET /index` 带 token 返回 `200`。
4. 登录、退出、再登录。
5. 创建专栏、文章、评论，再查询列表和详情。
6. 点赞、搜索、上传头像并写入 `avatar`。
7. 修改密码，确认前端跳转到登录页，并用新密码重新登录。
8. 删除评论、文章、专栏。删除专栏前应有级联提示。
9. 注销临时账号，确认无残留数据。
