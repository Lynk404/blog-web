# 文章资源 (Articles)

> 基础路径：`/api/rest/articles`

## 字段说明 (Body)
| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | String | 是 | 文章标题 |
| `cover` | String | 否 | 封面图 URL |
| `content` | String | 是 | 正文内容（富文本） |
| `column` | String | 是 | 所属专栏 ID（后台会联动更新专栏的 `aids`） |
| `author` | String | 否 | **禁止前端传值**，后台自动从 Token 注入当前用户 ID |

> **创建时只接受上表中 `title`、`cover`、`content`、`column` 四个字段**，其余字段一律忽略。`hit_num`、`like_num`、`comment_num`、`comments`、`date` 等由服务端维护，前端传入不生效。
> **创建前的校验**：`column` 缺失返回 `422`（`专栏必填`），指向不存在的专栏返回 `422`（`专栏不存在`），指向**他人的专栏**返回 `403`（`无权添加到该专栏`）。以上情况都不会写入文章。

## 特殊规则
1. **阅读量自增**：每次调用 `GET /api/rest/articles/:id` 获取详情时，后台自动让 `hit_num` 阅读量 +1。
2. **更新限制**：`PUT /api/rest/articles/:id` 只能修改 `title`、`cover`、`content`，且必须是文章作者本人操作。
2.1 **删除限制**：`DELETE /api/rest/articles/:id` 只能由文章作者本人操作，非作者返回 `403`。删除时会一并删除该文章下的**全部评论**，并从所属专栏的 `aids` 中移除该文章 ID。
3. **关联查询**：获取详情或列表时，后台自动 populate 作者信息(`author`)、专栏信息(`column`)及评论列表(`comments`)。