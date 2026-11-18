export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface ApiEntry {
  /** 相对于 VITE_APP_BASE_URL 的路径 */
  url: string
  method: HttpMethod
  /** 需要 RSA 加密的字段名（如 password）；多个字段时传数组 */
  rsaKey?: string | string[]
  /** url 中以 `:参数名` 结尾，取 data 中同名字段替换 */
  rest?: boolean
  /** 响应中包含 token/userId，需写入本地存储 */
  setToken?: boolean
  /** 失败时不弹出错误通知 */
  noMessage?: boolean
}

const API_LIST = {
  register: { url: '/admin/register', method: 'POST', rsaKey: 'password', setToken: true },
  // 后端 /user 路由挂载在根路径，使用尾斜杠避免 Express 的 301 重定向
  getUserInfo: { url: '/user/', method: 'GET' },
  putUserInfo: { url: '/user/', method: 'PUT', rsaKey: ['password', 'oldPassword'] },
  deleteUser: { url: '/user/', method: 'DELETE', rsaKey: 'password' },
  index: { url: '/index', method: 'GET', noMessage: true },
  login: { url: '/admin/login', method: 'POST', rsaKey: 'password', setToken: true },
  pubKey: { url: '/keys', method: 'GET' },
  articles: { url: '/api/rest/articles', method: 'GET' },
  columns: { url: '/api/rest/columns', method: 'GET' },
  comments: { url: '/api/rest/comments', method: 'GET' },
  getUserById: { url: '/api/rest/users/:id', method: 'GET', rest: true },
  postColumn: { url: '/api/rest/columns', method: 'POST' },
  postComment: { url: '/api/rest/comments', method: 'POST' },
  postArticle: { url: '/api/rest/articles', method: 'POST' },
  getArticleById: { url: '/api/rest/articles/:id', method: 'GET', rest: true },
  getColumnById: { url: '/api/rest/columns/:id', method: 'GET', rest: true },
  search: { url: '/articles/search', method: 'GET' },
  uploadArticle: { url: '/upload/article', method: 'POST' },
  uploadUserAvatar: { url: '/upload/user', method: 'POST' },
  likeArticle: { url: '/articles/likes/:id', method: 'POST', rest: true },
  putArticle: { url: '/api/rest/articles/:id', method: 'PUT', rest: true },
  deleteArticle: { url: '/api/rest/articles/:id', method: 'DELETE', rest: true },
  putComment: { url: '/api/rest/comments/:id', method: 'PUT', rest: true },
  deleteComment: { url: '/api/rest/comments/:id', method: 'DELETE', rest: true },
  putColumn: { url: '/api/rest/columns/:id', method: 'PUT', rest: true },
  deleteColumn: { url: '/api/rest/columns/:id', method: 'DELETE', rest: true },
} satisfies Record<string, ApiEntry>

export type ApiType = keyof typeof API_LIST

export default API_LIST as Record<ApiType, ApiEntry>
