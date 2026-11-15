# 通用资源总线 (/api/rest/:resource)

本模块是系统的核心，采用**动态总线（Bus）设计**。 实现**一套代码处理所有资源的增删改查**。
> 通过 URL 参数 `:resource` 动态映射到对应 Mongoose Model：
> `articles → Article`、`columns → Column`、`comments → Comment`、`users → User`
> 仅当 `models/<PascalName>.js` 存在时有效，否则 `404`。

## 通用操作
| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/rest/:resource` | 否 | 获取列表，支持 `page, size, query, options` 等参数 |
| GET | `/api/rest/:resource/:id` | 否 | 获取详情 |
| POST | `/api/rest/:resource` | 是 | 创建资源 |
| PUT | `/api/rest/:resource/:id` | 是 | 更新资源（仅作者可改；`users` 不支持，见下文） |
| DELETE | `/api/rest/:resource/:id`| 是 | 删除资源（仅作者可删；`users` 不支持） |

> `users` 资源没有总线的 POST / PUT / DELETE 入口（直接返回 `404`）：注册请用 `/admin/register`，修改资料请用 `/user`（见 [其他接口](../other/other.md)）。`users` 的公开 GET 只返回展示字段，详见 [用户资源](./users.md)。

---

## 1. 路由映射规则

URL 中的 `:resource` 采用**复数形式**，框架底层会通过 `inflection` 库自动转换为**单数首字母大写**的 Model 名称，并加载对应的 `models/*.js` 文件。

| URL 示例 | 映射 Model | 说明 |
| --- | --- | --- |
| `/api/rest/articles` | `Article` | 文章 |
| `/api/rest/columns` | `Column` | 专栏/分类 |
| `/api/rest/comments` | `Comment` | 评论 |
| `/api/rest/users` | `User` | 用户 |

> ⚠️ **注意**：仅当 `models/` 目录下存在对应的 Model 文件时接口才有效，否则返回 `404`。

---

## 2. 通用端点列表

每个资源都自动拥有以下 5 个标准 RESTful 端点：

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/api/rest/:resource` | 否 | 获取资源列表（支持分页/搜索/筛选） |
| `GET` | `/api/rest/:resource/:id` | 否 | 获取单条资源详情 |
| `POST` | `/api/rest/:resource` | 是 | 创建资源 |
| `PUT` | `/api/rest/:resource/:id` | 是 | 更新资源（需作者身份与字段白名单） |
| `DELETE`| `/api/rest/:resource/:id` | 是 | 删除资源（仅作者可删，同步清理父文档引用） |

> **业务差异**：不同资源的必填字段、更新白名单、级联联动等业务规则各不相同，请查阅具体的资源说明文档。
> 底层联动机制与注入原理请查阅：[插件映射机制说明 (plugins.md)](./plugins.md)。

---

## 3. 列表查询通用参数 (`GET /api/rest/:resource`)

总线支持高度灵活的 Query 参数拼装，底层配合 `qs` 和 `pagination` 工具类实现。

| 参数 | 默认值 | 类型 | 说明 |
| --- | --- | --- | --- |
| `page` | `1` | Number | 当前页码 |
| `size` | `100` | Number | 每页条目数，**上限 100**，超出按 100 处理 |
| `dis` | `8` | Number | 分页器显示的页码数量 |
| `query` | `{}` | Object | 数据库查询条件（支持 qs 嵌套解析）。**不允许 Mongo 操作符**（键名以 `$` 开头，如 `query[$where]`、`query[title][$ne]`），传入返回 `400` |
| `query[q]` | - | String | **全局关键字搜索**（部分资源如文章，会针对 title/content 做正则搜索） |
| `options` | `{}` | Object | Mongoose 查询配置（如排序、字段过滤） |

**高级查询示例**：
```http
# 分页获取第 2 页，每页 10 条
GET /api/rest/articles?page=2&size=10

# 关键字搜索 (search)
GET /api/rest/articles?query[q]=Vue3

# 按字段精确筛选 (find)
GET /api/rest/articles?query[column]=60d5ecb8...

# 排序与字段限制 (options)
GET /api/rest/articles?options[sort]=-date&options[select]=title,cover
```

---

## 4. 响应格式约定

**成功获取列表**：
```json
{
  "code": 200,
  "message": "ok",
  "data": {
    "count": 150,           // 总条数
    "list": [ ... ],        // 当前页数据列表
    "page": 1,              // 当前页码
    "size": 10,             // 每页条数
    "pages": 15             // 总页数
  }
}
```

**操作成功（添加/更新/删除）**：
```json
{
  "code": 200,
  "message": "提交成功", 
  "data": { "id": "60d5ecb8..." } // 创建成功时返回新 ID
}
```

---

## 5. 具体资源文档导航

每个资源的专属业务规则（必填字段、注入、白名单等）请查阅以下文档：

- 📄 [文章资源 (articles.md)](./articles.md)
- 📄 [评论资源 (comments.md)](./comments.md)
- 📄 [专栏资源 (columns.md)](./columns.md)
- 📄 [用户资源 (users.md)](./users.md)

---

## 6. 安全与权限说明

1. **GET 接口免鉴权**：资源列表和详情对外公开，无需携带 Token。
2. **写操作需鉴权**：POST / PUT / DELETE 必须在 Header 中携带 `Authorization: Bearer <token>`。
3. **归属权校验**：PUT 和 DELETE 操作通过 `POP_PUT_MAP` 校验当前用户是否为该资源的所有者（如文章作者、评论发布者）。非所有者返回 `400`（PUT）或 `403`（DELETE）。`users` 资源没有总线的 PUT / DELETE 入口，直接返回 `404`。
4. **字段白名单**：PUT 操作不允许全量更新，只允许更新白名单内的特定字段（如文章只允许改标题、内容），防止恶意篡改阅读量等核心数据。

---

### 为什么这样写？
```text
1. **不重复**：没有把“文章创建需要什么字段”写在这里，把篇幅全部留给分页、q参数嵌套、options排序等**总线通用玩法**。
2. **有导航**：清晰指引前端去点开具体的资源文件。
3. **原理解释**：解释了 `:resource` 映射到 `Model` 的机制（复数转单数），这能帮前端理解为什么 URL 叫 `articles` 而不是 `Article`。
4. **示例齐全**：给了最容易出错的 `qs` 查询示例（`query[column]`），这是用 Express 开发 RESTful API 的常见痛点，直接给示例能省去很多沟通成本。
```