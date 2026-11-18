# 其他接口

## 获取公钥
**GET** `/keys` （免鉴权）
返回当前 RSA 公钥，前端用于加密密码。
- 响应：RSA 公钥字符串
```json
{ "message": "ok", "data": { "pubKey": "-----BEGIN PUBLIC KEY-----..." } }
```
- 公钥取自 `Key` 集合第一条文档的 `content` 字段，**密钥为 2048 位**。
- **错误**：`Key` 集合为空时返回 `404`（`公钥未初始化`）。

> ⚠️ **`Key` 集合需要手动维护**：代码中没有任何地方会写入 `Key` 文档，`GET /keys` 完全依赖它。部署或更换密钥后必须同步，否则前端拿到的公钥与服务端私钥不匹配，所有登录都会失败。
>
> 用脚本同步（推荐，清空后写入当前 `auth/public.cer`）：
> ```bash
> node scripts/sync-key.js
> ```
> 手工等价操作：
> ```js
> // mongosh db_blog
> db.keys.deleteMany({})
> db.keys.insertOne({ content: <auth/public.cer 的全文>, date: new Date() })
> ```
> 密钥位数升级（512 → 2048）和填充迁移（PKCS#1 v1.5 → OAEP）均已通过 `scripts/` 下的脚本处理。

## 校验登录态
**GET** `/index` （需鉴权）
- 响应：
- 已登录：`{ "message": "ok" }`
- 未登录：HTTP `401`，`{ "message": "请先登录" }`

## 用户模块 (`/user`)
需鉴权。挂载在 `routes/user.js`。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/user` | 获取当前登录用户信息，附带 `articleCount`、`columnCount` |
| PUT | `/user` | 更新当前用户信息，仅允许 `password`、`email`、`nikname`、`avatar` |
| DELETE | `/user` | 注销当前账号（不可恢复），级联规则见下文 |

**PUT `/user` 请求体**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `email` | string | 否 | 新邮箱（唯一） |
| `nikname` | string | 否 | 新昵称 |
| `avatar` | string | 否 | 新头像 URL（一般为 `/upload/user` 返回的地址） |
| `password` | string | 否 | 新密码，RSA 加密后的密文 |
| `oldPassword` | string | 修改 `password` 时必填 | 旧密码，RSA 加密后的密文 |

- 只提交 `password` 时，必须同时提供正确的 `oldPassword`。缺少返回 `422`（`请提供旧密码`），错误返回 `422`（`旧密码错误`）。
- **修改密码后，此前签发的所有 token 立即失效**（之后用这些 token 访问鉴权接口会被拒绝）。前端应在修改成功后丢弃旧 token，并重新登录。
- 白名单之外的字段会被忽略；过滤后没有任何合法字段返回 `400`（`修改失败`）。

**DELETE `/user` 注销账号**

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `password` | string | 是 | 当前密码，RSA 加密后的密文，用于二次确认 |

- 密码缺失返回 `422`（`请提供密码`），错误返回 `422`（`密码错误`）。
- 成功返回 `{ "message": "注销成功" }`。注销后该账号的 token 立即失效：之后的鉴权接口不再通过，登录也返回 `422`（`用户不存在`）。

**级联规则**（注销不可恢复，按以下顺序执行，先删内容、最后删用户，中途失败时账号仍在，可重试）：

1. **专栏**：删除用户名下的所有专栏（`Column.uid = 用户`）。
2. **文章**：删除用户作为作者的文章，以及上一步被删专栏中的**所有文章（包括他人发表的）**。
3. **评论**：删除待删文章下的**所有评论（包括他人的）**，以及用户自己发表的评论。
4. **保留文章的计数修正**：用户在其他人文章下发表的评论被删除，该文章的 `comments` 同步移除对应 ID，`comment_num` 相应减少。
5. **专栏引用**：被删除的文章从所有专栏的 `aids` 中移除。
6. **用户**：最后删除用户记录。

> ⚠️ 注销会删除**他人在本人专栏中发表的文章**，以及**他人在本人文章下的评论**。这是当前确定的规则，前端应在确认前明确提示用户。

## 文件上传
**POST** `/upload/:classify` （需鉴权）
`:classify` 为 `user`（头像）或 `article`（文章图片），其他值返回 `400`。
**Content-Type**：`multipart/form-data`
| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | File | 是 | 上传文件，**只允许图片**：`.jpg` `.jpeg` `.png` `.gif` `.webp`（按扩展名判断），受 `config.maxFileSize` 限制 |
| `uid` | string | 视场景 | 当分类为 `user`（头像）时必填，且**必须等于当前登录用户的 id**：缺失返回 `422`（`用户头像必须指定UID`），不是本人返回 `403`（`无权上传该用户的头像`）。被拒绝的请求不会留下文件 |

> 文件类型不符返回 `422`（`只允许上传图片文件（jpg/png/gif/webp）`）。图片经同源访问时带 `X-Content-Type-Options: nosniff`。
**响应**
```json
// classify=user：{ "message": "上传成功", "data": { "fileURL": "http://127.0.0.1:3000/user/<filename>" } }
// classify=article（富文本编辑器格式）：{ "errno": 0, "data": ["http://127.0.0.1:3000/article/<filename>"] }
```
**错误**
- 文件超过限制：`422`，`文件大小不得超过 2097152 bytes`
> 上传成功后文件位于 `uploads/user/` 或 `uploads/article/`，通过 `http://127.0.0.1:3000/user/<filename>` 或 `http://127.0.0.1:3000/article/<filename>` 访问。
>
> 以上为本地示例；线上 URL 前缀由 `config.js` 的 `uploadURL` 决定。新用户和新文章不再写入默认头像/封面，`avatar`、`cover` 可能不存在。
