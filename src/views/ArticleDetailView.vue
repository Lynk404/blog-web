<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import Http from '../api'
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
    <el-button link class="back" @click="router.back()">← 返回</el-button>

    <el-skeleton v-if="loading" :rows="6" animated />

    <el-result v-else-if="notFound" icon="warning" title="帖子不存在或加载失败" />

    <template v-else-if="article">
      <h1 class="title">{{ article.title }}</h1>
      <div class="meta">
        <span v-if="article.column">
          <RouterLink :to="{ name: 'column-detail', params: { id: article.column._id } }">
            {{ article.column.name }}
          </RouterLink>
        </span>
        <span v-if="article.author">{{ article.author.nikname }}</span>
        <span>阅读 {{ article.hit_num }}</span>
        <span>点赞 {{ article.like_num }}</span>
      </div>

      <!-- Markdown 经 v-md-editor 预览渲染，内置 xss 过滤 -->
      <div class="content">
        <MarkdownPreview :text="article.content" />
      </div>

      <div class="actions">
        <el-button class="action" :loading="liking" :disabled="hasLiked" @click="like">
          {{ hasLiked ? '已点赞' : '点赞' }}
        </el-button>
        <template v-if="isAuthor">
          <el-button class="action" @click="editArticle">编辑</el-button>
          <el-button class="action" type="danger" plain @click="removeArticle">删除</el-button>
        </template>
      </div>

      <h3 class="comments-title">评论（{{ article.comments?.length ?? 0 }}）</h3>
      <el-empty v-if="!article.comments?.length" description="暂无评论" />
      <div v-for="c in article.comments" :key="c._id" class="comment">
        <div class="comment-meta">
          <span>{{ c.uid?.nikname ?? '匿名' }}</span>
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
        <div v-else class="comment-body">{{ c.content }}</div>
      </div>

      <div v-if="user.isLoggedIn" class="comment-form">
        <el-input v-model="commentText" type="textarea" :rows="3" placeholder="写下你的评论" />
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
      <p v-else class="login-tip">
        <RouterLink :to="{ name: 'login', query: { redirect: route.fullPath } }">登录</RouterLink>
        后发表评论
      </p>
    </template>
  </div>
</template>

<style scoped>
.back {
  margin-bottom: 12px;
}

.title {
  font-size: 24px;
  margin: 8px 0 12px;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}

.content {
  min-height: 120px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 20px 0;
}

.action {
  min-height: 44px;
}

.comments-title {
  margin-top: 32px;
}

.comment {
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.comment-action {
  min-height: 44px;
}

.comment-body {
  white-space: pre-wrap;
}

.comment-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.comment-form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  margin-top: 20px;
}

.comment-form .el-textarea {
  width: 100%;
}

.login-tip {
  margin-top: 20px;
  color: var(--el-text-color-secondary);
}
</style>
