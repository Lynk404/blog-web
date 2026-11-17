# 核心架构：Bus 总线与插件映射机制 (Plugins)

本项目的 `/api/rest/:resource` 路由是一个高度抽象的通用控制器（总线）。
为了让所有资源共用同一套 CRUD 代码，我们在 `plugins/` 目录下定义了 6 个映射表（MAP），用于注入特定资源的**特殊业务规则**。

---

## 1. 请求拦截与字段注入：`RESOURCE_POST_MAP.js`

**作用**：在数据 `POST` 保存到数据库前，强行注入当前登录用户的 ID，防止前端恶意伪造作者。同时可以扩展其他固定字段。

| 资源 | 注入字段 | 说明 |
| --- | --- | --- |
| `Article` | `author = req._id` | 创建文章时，自动将当前用户设为作者 |
| `Column` | `uid = req._id` | 创建专栏时，自动记录创建者 ID |
| `Comment` | `uid = req._id` | 创建评论时，自动记录评论者 ID |

**代码逻辑**：通过解构 `body`，并追加 `_id` 返回新的对象。

---

## 2. 创建后的数据联动：`POP_POST_MAP.js`

**作用**：在数据 `POST` 成功后，触发其他表的级联更新（Cascading Updates），保证数据的一致性。

| 资源 | 必填外键 | 联动操作 | 说明 |
| --- | --- | --- | --- |
| `Comment` | `aid` (文章ID) | 更新 `Article` | 向对应文章的 `comments` 数组 `$push` 新评论 ID，并让 `comment_num` 加 1。 |
| `Article` | `column` (专栏ID) | 更新 `Column` | 向对应专栏的 `aids` 数组 `$push` 新文章 ID。 |

**代码逻辑**：通过 `_refId` 找到外键，通过 `_model` 找到要修改的关联表，执行 `queryAct`（如 `findByIdAndUpdate`）并传入 `options`。

---

## 3. 详情访问的联动：`POP_GET_MAP.js`

**作用**：在 `GET` 获取单条详情时，触发的隐性数据更新（如阅读量自增）。

| 资源 | 联动操作 | 说明 |
| --- | --- | --- |
| `Article` | `hit_num + 1` | 用户每访问一次文章详情（GET），阅读量自动加 1。 |

**注意**：这个操作是异步的，不会阻塞详情数据的返回。

---

## 4. 更新权限与白名单：`POP_PUT_MAP.js`

**作用**：在 `PUT` 更新数据时，提供双重安全保护：**白名单过滤** + **归属权校验**。

| 资源 | 允许修改字段 (`revisable`) | 归属校验字段 (`authField`) |
| --- | --- | --- |
| `Article` | `title`, `cover`, `content` | `author` (必须是文章作者) |
| `User` | `password`, `email`, `nikname`, `avatar` | `_id` (只能改自己) |
| `Comment` | `content` | `uid` (必须是评论者) |
| `Column` | `name` | `uid` (必须是专栏创建者) |

**防篡改机制**：如果前端尝试用 `PUT` 修改不在白名单里的字段（如 `hit_num`、`like_num`），这些字段会被直接丢弃。如果过滤后没有任何合法字段，则报错 `"修改失败"`。

**DELETE 同样使用 `authField` 做归属校验**（非所有者返回 `403`）。`User` 没有总线的 PUT / DELETE 入口，直接返回 `404`（表中 `User` 行的 `authField` 仅作记录，不再用于总线校验）。删除后的联动见下表。

**公开读取限制（`PUBLIC_VIEW`）**：`User` 的免鉴权 GET 强制 `select` 为 `nikname avatar signature`，列表只允许 `query[nikname]` 筛选，忽略用户传入的 `options`。

| 资源 | 删除后的联动 |
| --- | --- |
| `Comment` | 从 `Article.comments` `$pull` 该评论 ID，并使 `comment_num` 减 1 |
| `Article` | 先删除该文章下的全部评论，再从 `Column.aids` `$pull` 该文章 ID |

---

## 5. 关联查询（联表查询）：`POPULATE_MAP.js`

**作用**：在 `GET` 列表或详情时，自动替换外键 ID 为实际数据对象（Mongoose 的 `populate` 机制），减少前端请求次数。

| 资源 | 填充字段 (path) | 提取子字段 (select) | 嵌套填充 |
| --- | --- | --- | --- |
| `Article` | `author` | `nikname`, `avatar` | 无 |
| | `column` | `name` | 无 |
| | `comments` | `content`, `date`, `uid` | 嵌套填充评论者的 `uid` (`nikname`, `avatar`) |
| `Comment` | `uid` | `nikname`, `avatar` | 无 |
| `Column` | `aids` | `title`, `cover`, `date`, `hit_num`, `comment_num`, `like_num`, `author` | 无 |

**优势**：例如获取文章列表时，前端直接拿到作者头像、专栏名称和评论列表，无需二次查询。

---

## 6. 数据库错误汉化：`QUE_MAP.js`

**作用**：将 MongoDB 抛出的英文报错字段（如唯一索引冲突），翻译成友好的中文提示。

| 英文字段 | 中文翻译 |
| --- | --- |
| `username` | 用户名 |
| `password` | 密码 |
| `email` | 邮箱 |
| `nikname` | 昵称 |
| `avatar` | 头像 |

**业务场景**：注册时如果用户名重复，MongoDB 报错 `duplicate key error`，全局错误处理中间件会结合此表返回 `{"message": "用户名不能重复"}` (HTTP 422)。