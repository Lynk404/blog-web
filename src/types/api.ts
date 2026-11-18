/** 列表接口的分页结构（GET /api/rest/:resource、/articles/search） */
export interface Pagination<T> {
  count: number
  page: number
  size: number
  total: number
  pages: number
  display: number
  list: T[]
}

/** populate 后的简要用户信息 */
export interface UserBrief {
  _id: string
  nikname: string
  avatar?: string
}

export interface ColumnBrief {
  _id: string
  name: string
}

/** 公开用户信息（GET /api/rest/users/:id，后端只返回这些字段） */
export interface PublicUser {
  _id: string
  nikname: string
  avatar?: string
  signature?: string
}

/** 文章列表项（populate: author、column） */
export interface ArticleBrief {
  _id: string
  title: string
  cover?: string
  date: string
  hit_num: number
  comment_num: number
  like_num: number
  author?: UserBrief
  column?: ColumnBrief
}

export interface Comment {
  _id: string
  content: string
  date: string
  /** 评论所属帖子 id */
  aid?: string
  uid?: UserBrief
}

/** 文章详情（populate: author、column、comments） */
export interface ArticleDetail extends ArticleBrief {
  content: string
  comments: Comment[]
}

/** 专栏（列表与详情接口返回的 aids 为 populate 后的文章） */
export interface Column {
  _id: string
  name: string
  /** 专栏创建者 id，用于判断是否为本人专栏 */
  uid?: string
  aids?: ArticleBrief[]
}

/** 当前登录用户（GET /user），含统计数字 */
export interface UserProfile {
  _id: string
  username: string
  nikname: string
  email: string
  avatar?: string
  signature?: string
  articleCount: number
  columnCount: number
}

export interface AuthResult {
  token: string
  userId: string
}
