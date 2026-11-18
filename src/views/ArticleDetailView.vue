<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Calendar,
  ChatDotRound,
  Delete,
  Edit,
  Folder,
  Star,
  User,
  View,
} from '@element-plus/icons-vue'
import Http from '../api'
import PanelBox from '../components/PanelBox.vue'
import { useUserStore } from '../stores/user'
import type { ArticleDetail, Comment } from '../types/api'
import { confirmAction } from '../utils/confirm'

// Markdown 预览按需加载，避免进入首页时加载渲染库
const MarkdownPreview = defineAsyncComponent(() => import('../components/MarkdownPreview.vue'))

const route = useRoute()
const router = useRouter()
const user = useUserStore()

const article = ref<ArticleDetail | null>(null)
const loading = ref(false)
const notFound = ref(false)
const liking = ref(false)
const hasLiked = ref(false)
const commentText = ref('')
const submittingComment = ref(false)
const editingCommentId = ref<string | null>(null)
const editingCommentText = ref('')
const savingCommentId = ref<string | null>(null)

const isAuthor = computed(
  () => !!article.value && user.isLoggedIn && article.value.author?._id === user.uid,
)
const isCommentOwner = (c: Comment) => user.isLoggedIn && c.uid?._id === user.uid
const authorText = computed(() => article.value?.author?.nikname?.charAt(0) ?? '')
const currentUserText = computed(() => user.profile?.nikname?.charAt(0) ?? '')
const commentCount = computed(() => article.value?.comments?.length ?? 0)
// 后端按创建顺序返回评论，展示时倒序，最新评论在最上面
const orderedComments = computed(() => [...(article.value?.comments ?? [])].reverse())

// 注意：GET /api/rest/articles/:id 每次调用阅读数 +1，只在进入页面时请求一次
async function load() {
  loading.value = true
  notFound.value = false
  hasLiked.value = false
  try {
    article.value = await Http<ArticleDetail>({
      type: 'getArticleById',
      data: { id: String(route.params.id) },
    })
  } catch {
    article.value = null
    notFound.value = true
  } finally {
    loading.value = false
  }
}

function goLogin() {
  router.push({ name: 'login', query: { redirect: route.fullPath } })
}

// 直接打开帖子链接时没有上一条历史，回首页而不是无反应
function goBack() {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'home' })
}

// 后端不限制重复点赞，前端在本页内只允许成功点赞一次
async function like() {
  if (!article.value) return
  if (!user.isLoggedIn) {
    goLogin()
    return
  }
  liking.value = true
  try {
    const result = await Http<{ likes: number }>({
      type: 'likeArticle',
      data: { id: article.value._id },
    })
    article.value.like_num = result.likes
    hasLiked.value = true
  } catch {
    // 错误已由 Http 弹出提示
  } finally {
    liking.value = false
  }
}

async function submitComment() {
  const content = commentText.value.trim()
  if (!article.value || !content) return
  submittingComment.value = true
  try {
    // 评论接口只返回新 id；不重新请求文章详情，避免阅读数重复计数
    const result = await Http<{ id: string }>({
      type: 'postComment',
      data: { content, aid: article.value._id },
    })
    article.value.comments.push({
      _id: result.id,
      content,
      date: '',
      uid: {
        _id: user.uid ?? '',
        nikname: user.profile?.nikname ?? '我',
        avatar: user.profile?.avatar,
      },
    })
    article.value.comment_num += 1
    commentText.value = ''
  } catch {
    // 错误已由 Http 弹出提示
  } finally {
    submittingComment.value = false
  }
}

function startEditComment(c: Comment) {
  editingCommentId.value = c._id
  editingCommentText.value = c.content
}

function cancelEditComment() {
  editingCommentId.value = null
  editingCommentText.value = ''
}

async function saveComment(c: Comment) {
  const content = editingCommentText.value.trim()
  if (!content) {
    ElMessage.warning('评论内容不能为空')
    return
  }
  savingCommentId.value = c._id
  try {
    await Http({ type: 'putComment', data: { id: c._id, content } })
    c.content = content
    cancelEditComment()
    ElMessage.success('评论已修改')
  } catch {
    // 错误已由 Http 弹出提示
  } finally {
    savingCommentId.value = null
  }
}

async function removeComment(c: Comment) {
  const ok = await confirmAction('确认删除这条评论？', '删除评论', '删除')
  if (!ok || !article.value) return
  try {
    await Http({ type: 'deleteComment', data: { id: c._id } })
    article.value.comments = article.value.comments.filter((x) => x._id !== c._id)
    article.value.comment_num = Math.max(0, article.value.comment_num - 1)
    ElMessage.success('评论已删除')
  } catch {
    // 错误已由 Http 弹出提示
  }
}

function editArticle() {
  if (!article.value) return
  router.push({ name: 'article-edit', params: { id: article.value._id } })
}

async function removeArticle() {
  if (!article.value) return
  // 会同时删除该文章下的全部评论（包括他人的）
  const ok = await confirmAction(
    '删除后无法恢复，该帖子下的全部评论也会被删除。确认删除？',
    '删除帖子',
    '删除',
  )
  if (!ok) return
  try {
    await Http({ type: 'deleteArticle', data: { id: article.value._id } })
    ElMessage.success('帖子已删除')
    router.push({ name: 'home' })
  } catch {
    // 错误已由 Http 弹出提示
  }
}

// 仅在挂载与 id 真正变化时请求，不因重渲染重复计数
onMounted(load)
watch(() => route.params.id, load)
</script>

<template>
  <div class="detail">
    <el-button link class="back" @click="goBack">← 返回</el-button>

    <el-skeleton v-if="loading" class="loading" :rows="8" animated />

    <el-result v-else-if="notFound" icon="warning" title="帖子不存在或加载失败" />

    <div v-else-if="article" class="detail-grid">
      <article class="content-card">
        <h1 class="title">{{ article.title }}</h1>

        <div class="author-row">
          <el-avatar :size="40" :src="article.author?.avatar">{{ authorText }}</el-avatar>
          <div class="author-main">
            <RouterLink
              v-if="article.author"
              class="author-name"
              :to="{ name: 'user-profile', params: { id: article.author._id } }"
            >
              {{ article.author.nikname }}
            </RouterLink>
            <span v-else class="author-name">匿名</span>
            <span class="author-date">{{ article.date }}</span>
          </div>
        </div>

        <div class="meta">
          <span>
            <el-icon aria-hidden="true"><Calendar /></el-icon>
            {{ article.date }}
          </span>
          <span>
            <el-icon aria-hidden="true"><View /></el-icon>
            阅读 {{ article.hit_num }}
          </span>
          <span>
            <el-icon aria-hidden="true"><ChatDotRound /></el-icon>
            评论 {{ commentCount }}
          </span>
        </div>

        <img v-if="article.cover" :src="article.cover" alt="" class="detail-cover" />

        <!-- Markdown 经 v-md-editor 预览渲染，内置 xss 过滤 -->
        <div class="content">
          <MarkdownPreview :text="article.content" />
        </div>

        <div class="actions">
          <div class="action-stats">
            <span>点赞 {{ article.like_num }}</span>
            <span>评论 {{ commentCount }}</span>
          </div>
          <div class="action-buttons">
            <el-button
              class="action app-pill-btn"
              :loading="liking"
              :disabled="hasLiked"
              @click="like"
            >
              <el-icon><Star /></el-icon>
              <span>{{ hasLiked ? '已点赞' : '点赞' }}</span>
            </el-button>
            <template v-if="isAuthor">
              <el-button class="action app-pill-btn" @click="editArticle">
                <el-icon><Edit /></el-icon>
                <span>编辑</span>
              </el-button>
              <el-button class="action app-pill-btn app-pill-danger" @click="removeArticle">
                <el-icon><Delete /></el-icon>
                <span>删除</span>
              </el-button>
            </template>
          </div>
        </div>
      </article>

      <aside class="detail-side">
        <PanelBox title="发帖人" :icon="User" variant="plain">
          <div class="side-author">
            <el-avatar :size="56" :src="article.author?.avatar">{{ authorText }}</el-avatar>
            <div class="side-author-main">
              <span class="side-author-name">{{ article.author?.nikname ?? '匿名' }}</span>
              <span class="side-author-tag">楼主</span>
            </div>
          </div>
          <RouterLink
            v-if="article.author"
            class="side-link"
            :to="{ name: 'user-profile', params: { id: article.author._id } }"
          >
            <span>查看 TA 的主页</span>
            <span aria-hidden="true">→</span>
          </RouterLink>
        </PanelBox>

        <PanelBox v-if="article.column" title="所属专栏" :icon="Folder" variant="plain">
          <RouterLink
            class="side-link"
            :to="{ name: 'column-detail', params: { id: article.column._id } }"
          >
            <span>{{ article.column.name }}</span>
            <span aria-hidden="true">→</span>
          </RouterLink>
        </PanelBox>

        <PanelBox title="帖子信息" :icon="Calendar" variant="plain">
          <dl class="info-list">
            <div>
              <dt>发布时间</dt>
              <dd>{{ article.date }}</dd>
            </div>
            <div>
              <dt>阅读</dt>
              <dd>{{ article.hit_num }}</dd>
            </div>
            <div>
              <dt>点赞</dt>
              <dd>{{ article.like_num }}</dd>
            </div>
            <div>
              <dt>评论</dt>
              <dd>{{ commentCount }}</dd>
            </div>
          </dl>
        </PanelBox>
      </aside>

      <PanelBox class="comments-panel" title="评论区" :icon="ChatDotRound" variant="plain">
        <template #actions>
          <span class="panel-count">共 {{ commentCount }} 条</span>
        </template>

        <div v-if="user.isLoggedIn" class="comment-form">
          <el-avatar :size="36" :src="user.profile?.avatar">{{ currentUserText }}</el-avatar>
          <div class="comment-input">
            <el-input v-model="commentText" type="textarea" :rows="3" placeholder="写下你的评论…" />
            <div class="comment-submit">
              <el-button
                type="primary"
                class="action"
                :loading="submittingComment"
                :disabled="!commentText.trim()"
                @click="submitComment"
              >
                发表评论
              </el-button>
            </div>
          </div>
        </div>
        <p v-else class="login-tip">
          <RouterLink :to="{ name: 'login', query: { redirect: route.fullPath } }">登录</RouterLink>
          后发表评论
        </p>

        <el-empty v-if="!article.comments?.length" :image-size="80" description="暂无评论" />

        <div v-for="c in orderedComments" :key="c._id" class="comment">
          <RouterLink
            v-if="c.uid?._id"
            class="avatar-link"
            :to="{ name: 'user-profile', params: { id: c.uid._id } }"
            :aria-label="`查看 ${c.uid.nikname ?? '用户'} 的主页`"
          >
            <el-avatar :size="36" :src="c.uid.avatar">
              {{ c.uid.nikname?.charAt(0) ?? '匿' }}
            </el-avatar>
          </RouterLink>
          <el-avatar v-else :size="36">{{ c.uid?.nikname?.charAt(0) ?? '匿' }}</el-avatar>
          <div class="comment-main">
            <div class="comment-head">
              <span class="comment-name">{{ c.uid?.nikname ?? '匿名' }}</span>
              <span v-if="c.date" class="comment-date">{{ c.date }}</span>
              <template v-if="isCommentOwner(c) && editingCommentId !== c._id">
                <el-button link class="comment-action" @click="startEditComment(c)">编辑</el-button>
                <el-button link class="comment-action" type="danger" @click="removeComment(c)">
                  删除
                </el-button>
              </template>
            </div>
            <template v-if="editingCommentId === c._id">
              <el-input v-model="editingCommentText" type="textarea" :rows="2" />
              <div class="comment-edit-actions">
                <el-button class="action" @click="cancelEditComment">取消</el-button>
                <el-button
                  type="primary"
                  class="action"
                  :loading="savingCommentId === c._id"
                  @click="saveComment(c)"
                >
                  保存
                </el-button>
              </div>
            </template>
            <p v-else class="comment-body">{{ c.content }}</p>
          </div>
        </div>
      </PanelBox>
    </div>
  </div>
</template>

<style scoped>
.back {
  margin-bottom: 12px;
}

.loading {
  padding: 24px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--app-surface);
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(280px, 2fr);
  grid-template-areas:
    'main side'
    'comments side';
  gap: 40px;
  align-items: start;
}

.content-card {
  grid-area: main;
  min-width: 0;
  padding: 28px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--app-surface);
  box-shadow: var(--app-panel-shadow);
}

.title {
  margin: 0 0 20px;
  color: var(--el-text-color-primary);
  font-size: 26px;
  font-weight: 600;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.author-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.author-name {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
}

a.author-name:hover {
  color: var(--el-color-primary-light-3);
}

.author-date {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin: 16px 0 20px;
  padding: 12px 0;
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.detail-cover {
  display: block;
  width: 100%;
  max-height: 360px;
  margin: 0 0 20px;
  border-radius: 12px;
  background: var(--el-fill-color);
  object-fit: cover;
}

.content {
  min-height: 120px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 28px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.action-stats {
  display: flex;
  gap: 16px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.action {
  min-height: 44px;
}

.detail-side {
  position: sticky;
  top: 92px;
  grid-area: side;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.side-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.side-author-main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.side-author-name {
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.side-author-tag {
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--app-gold-soft);
  color: var(--el-color-primary-light-3);
  font-size: 12px;
}

.side-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 44px;
  margin-top: 16px;
  padding: 0 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  color: var(--el-text-color-regular);
  font-size: 14px;
  text-decoration: none;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    color 0.2s;
}

.side-link:first-child {
  margin-top: 0;
}

.side-link:hover {
  border-color: var(--el-color-primary);
  background: var(--app-gold-soft);
  color: var(--el-color-primary-light-3);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
}

.info-list div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.info-list dt {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}

.info-list dd {
  margin: 0;
  color: var(--el-text-color-regular);
  text-align: right;
  overflow-wrap: anywhere;
}

.comments-panel {
  grid-area: comments;
  min-width: 0;
}

.panel-count {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.comment-form {
  display: flex;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.comment-input {
  flex: 1;
  min-width: 0;
}

.comment-submit {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.login-tip {
  margin: 0;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.comment {
  display: flex;
  gap: 12px;
  padding: 16px 0;
}

.comment + .comment {
  border-top: 1px solid var(--el-border-color-lighter);
}

.avatar-link {
  display: inline-flex;
  flex-shrink: 0;
  border-radius: 50%;
  text-decoration: none;
}

.avatar-link:hover {
  box-shadow: 0 0 0 2px var(--el-color-primary);
}

.avatar-link:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.comment-main {
  flex: 1;
  min-width: 0;
}

.comment-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.comment-name {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 500;
}

.comment-date {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.comment-action {
  min-height: 44px;
  padding: 0 4px;
}

.comment-body {
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.comment-main .el-textarea {
  margin-top: 8px;
}

.comment-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

@media (max-width: 960px) {
  .detail-grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'main'
      'side'
      'comments';
    gap: 16px;
  }

  .detail-side {
    position: static;
  }
}

@media (max-width: 600px) {
  .content-card {
    padding: 18px;
  }

  .title {
    font-size: 22px;
  }

  .meta {
    gap: 12px;
  }

  .action-buttons {
    width: 100%;
  }

  .comment-form {
    flex-direction: column;
  }
}
</style>
