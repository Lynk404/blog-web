# 文章扩展接口

## 1. 搜索文章
**GET** `/articles/search` （免鉴权）
**Query 参数**
| 参数 | 说明 |
| --- | --- |
| `query[q]` | 搜索关键字，必填；缺失或为空返回 `400`（`搜索关键词不能为空`） |
| `page` / `size` | 分页 |
**返回结果**
| 参数名  | 说明 | 必填 | 类型 | 值可能性 | 限制 | 示例 |
| --- | --- | --- | --- | --- | --- | --- |
|message|文本信息|是|[string]|:||ok|
|data|数据|是|[object]| || |
|data>>count|数据总数|是|[number]|:||1|
|data>>page|当前页码 1|是|[number]|:||1|
|data>>size|一页数据数量 100|是|[number]|:||100|
|data>>total|数据总数|是|[number]|:||1|
|data>>list|数据列表|是|[array]| || |
|data>>list>>title|文章标题|是|[string]|:||测试文章最新|
|data>>list>>_id|文章ID|是|[string]|:||5fdca8c6b5c4b9066085fcec|
|data>>pages|总页数|是|[number]|:||1|
|data>>display|分页数组|是|[array]|:||[1]|
**详细说明**：
可搜索内容{ title: { $regex: regExp } },  { content: { $regex: regExp } },文章标题 | 文章内容。
关键词会先做正则转义，按普通文本匹配；`query[q]` 为空或缺失时返回 `400`（`搜索关键词不能为空`）。

## 2. 点赞文章
**POST** `/articles/likes/:id` （需鉴权）

`id` 为文章 ID，直接放在路径中，**不需要请求体**。

**响应**
```json
{ "message": "点赞成功", "data": { "likes": 12 } }
```
- 效果：对应文章的 `like_num + 1`，`data.likes` 为自增后的点赞数。
- **错误**：文章不存在返回 `404`（`文章不存在`）。
- 需登录：未携带或无效 Token 返回 `401`。不校验重复点赞，同一用户可多次点赞。