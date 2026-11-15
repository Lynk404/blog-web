# 评论资源 (Comments)

> 基础路径：`/api/rest/comments`

## 字段说明 (Body)
| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `content` | String | 是 | 评论文字 |
| `aid` | String | **是** | 所属文章 ID（后台会联动将评论 ID `push` 到文章的 `comments` 列表中，并让 `comment_num` +1） |
| `uid` | String | 否 | **禁止前端传值**，后台自动注入当前用户 ID |

> **创建时只接受 `content`、`aid` 两个字段**，其余字段一律忽略。`date` 由服务端维护。
> **创建前会校验文章存在**：`aid` 缺失返回 `422`（`文章必填`），指向不存在的文章返回 `422`（`文章不存在`），两种情况都不会写入评论。`content` 缺失返回 `422`（`评论内容必填`）。

## 特殊规则
1. **更新限制**：`PUT /api/rest/comments/:id` 只能修改 `content`，且必须是评论者本人操作。
1.1 **删除限制**：`DELETE /api/rest/comments/:id` 只能由评论者本人操作，非评论者返回 `403`。删除后会从所属文章的 `comments` 中移除该评论 ID，并使 `comment_num` 减 1。
2. **关联查询**：获取评论列表时，后台自动 populate 评论者的头像与昵称(`uid`)。