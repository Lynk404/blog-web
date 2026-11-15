# API 接口文档 总览与约定

## 通用约定

### 基础信息
- Base URL: `http://127.0.0.1:3000`

> ⚠️ **CORS 当前允许任意来源并携带凭据**（前端仍在本地开发，暂未收紧）。上线前必须改为白名单，届时只有列出的前端域名可以跨域调用本接口。

### 响应格式

```json
{
  "code": 200,
  "message": "ok",
  "data": {}
}
```

- 成功时通常 `code` 为 `200`，`data` 为业务数据。
- 错误时 `code` 为 HTTP 状态码，`message` 为错误文本。
- **未登录访问任何路径（包括不存在的路径）都返回 `401`**，鉴权中间件先于路由执行，不会返回 `404`。例如未登录访问 `/nosuchpath` 得到 `401`。登录后访问不存在的路径才返回 `404`。

### 错误状态码

| 状态码 | 含义 |
| --- | --- |
| 400 | 请求参数错误 / 无权修改 / 修改失败 |
| 401 | 未登录、Token 无效或过期 |
| 403 | 无权访问 |
| 404 | 资源不存在（包括格式不合法的 ID，如 `/articles/notanid`） |
| 422 | 参数校验失败（必填 / 重复 / 格式错误 / 文件过大） |
| 500 | 服务器内部错误 |

### 鉴权

- 登录成功后获得 **JWT**，放在请求头：
  ```
  Authorization: Bearer <token>
  ```
- Token 使用 **RS256** 算法，签名密钥为 **JWT 专用 2048 位密钥对**：签发用 `auth/jwt-private.pem`，验签用 `auth/jwt-public.pem`。该密钥对与密码加密密钥（`auth/*.cer`）分离。
- Token 有效期 3 天。
- 中间件会校验用户是否存在，存在则挂载 `req._id`、`req.isPass = true`。

> ⚠️ **密钥切换说明**：JWT 密钥拆分后，此前签发的 token 全部失效，客户端需要重新登录获取新 token。

### 安全说明（密码传输）

- 密码在客户端用 RSA 公钥加密后随请求体传输。密钥为 **2048 位**，加密填充为 **OAEP**（`encryptionScheme: 'pkcs1_oaep'`，摘要 **SHA-1**）。
- 公钥由 `GET /keys` 提供，与服务端 `auth/public.cer` 一致，客户端应从该接口获取，不要写死在前端。
- **2026-11 变更：填充从 PKCS#1 v1.5 改为 OAEP。** 旧填充存在 Bleichenbacher 类填充预言机风险，已废弃。

#### ⚠️ 前端必须同步改造（否则所有登录失败）

服务端已切换为 OAEP，**旧客户端用 pkcs1 加密的密码将无法解密**。前端需改为 OAEP，摘要算法必须是 **SHA-1**（与 `node-rsa` 的 `pkcs1_oaep` 默认值一致）。

```js
// 浏览器 WebCrypto
const key = await crypto.subtle.importKey(
  'spki',
  pemToArrayBuffer(pubKeyPem),
  { name: 'RSA-OAEP', hash: 'SHA-1' },   // ← hash 必须是 SHA-1
  false,
  ['encrypt']
)
const cipher = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, new TextEncoder().encode(password))
```

```js
// Node.js / 使用 node-rsa 的环境
const rsa = new NodeRSA(pubKeyPem)
rsa.setOptions({ encryptionScheme: 'pkcs1_oaep' })   // ← 原来是 'pkcs1'
const cipher = rsa.encrypt(password, 'base64')
```

**注意**：`hash: 'SHA-256'` 会解密失败，服务端只接受 SHA-1。

#### 服务端与数据迁移记录

- 服务端：`core/util/util.js` 的 `encrypt` / `decrypt` 统一使用常量 `ENCRYPTION_SCHEME = 'pkcs1_oaep'`。
- 存量数据：2026-11 已用 `scripts/migrate-oaep.js` 完成重加密（旧填充解两层 → 新填充双层加密 → 写回），迁移前备份在系统临时目录。
- 密钥本身未更换，位数仍是 2048 位。

> 部署到新环境时，若数据库是旧填充的备份，需先跑 `node scripts/migrate-oaep.js`，否则存量用户无法登录。

### 免鉴权白名单

| 方法 | 路径 |
| --- | --- |
| GET | `/api/rest/*`（所有资源 GET） |
| POST | `/admin/login` |
| POST | `/admin/register` |
| GET | `/keys` |
| GET | `/articles/search` |

> 其余所有接口均需携带有效 Token。
>
> 免鉴权的 GET 是设计意图：页面展示（文章、专栏、评论列表与详情）需要未登录用户可读，只有用户操作才需要登录。`/user`、写操作以及上面列表之外的接口都需要 Token。


## 接口分类导航
- [认证管理 (admin)](./admin/login.md)
- [通用资源总线 (resource)](./resource/README.md)
- [文章扩展 (articles)](./articles/search.md)
- [文件上传 (upload)](./upload/file.md)
- [其他接口 (获取公钥 校验登录态 用户模块 文件上传)](./other/index.md)
