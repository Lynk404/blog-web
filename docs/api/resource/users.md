# 用户资源 (Users)

> 基础路径：`/api/rest/users`
> 注意：用户注册请走 `POST /admin/register`，修改资料请走 `PUT /user`。

## 特殊规则
1. **无总线写入口**：`POST /api/rest/users`、`PUT /api/rest/users/:id` 与 `DELETE /api/rest/users/:id` 均已取消，直接返回 `404`。注册请使用 [`POST /admin/register`](../admin/admin.md)，修改资料请使用 `PUT /user`（见 [其他接口](../other/other.md)）。
2. **公开读取字段收紧**：`GET /api/rest/users` 与 `GET /api/rest/users/:id` 免鉴权，只返回 `_id`、`nikname`、`avatar`、`signature`。不返回 `email`、`password`、`username`。
3. **列表筛选受限**：列表只允许按 `query[nikname]` 筛选。其他 `query` 字段与 `options` 参数会被忽略。
4. **修改入口为 `PUT /user`**：只能修改 `password`、`email`、`nikname`，且只能修改自己的信息。
5. **修改密码需旧密码**：提交 `password` 时必须同时提供 `oldPassword`，否则返回 `422`；旧密码错误返回 `422`。
6. **安全限制**：`password` 与 `oldPassword` 都必须是通过 RSA 公钥加密后的密文。