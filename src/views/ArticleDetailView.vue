<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Http from '../api'
import { useUserStore } from '../stores/user'
import type { ArticleDetail } from '../types/api'

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

// 仅在挂载与 id 真正变化时请求，不因重渲染重复计数
onMounted(load)
watch(() => route.params.id, load)
</script>

<template>
  <div class="detail">
    <el-button link class="back" @click="router.back()">← 返回</el-button>

    <el-skeleton v-if="loading" :rows="6" animated />

    <el-result v-else-if="notFound" icon="warning" title="文章不存在或加载失败" />

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

      <!-- 正文按纯文本显示，不渲染 HTML，避免 XSS -->
      <div class="content">{{ article.content }}</div>

      <div class="like">
        <el-button class="action" :loading="liking" :disabled="hasLiked" @click="like">
          {{ hasLiked ? '已点赞' : '点赞' }}
        </el-button>
      </div>

      <h3 class="comments-title">评论（{{ article.comments?.length ?? 0 }}）</h3>
      <el-empty v-if="!article.comments?.length" description="暂无评论" />
      <div v-for="c in article.comments" :key="c._id" class="comment">
        <div class="comment-meta">{{ c.uid?.nikname ?? '匿名' }}</div>
        <div class="comment-body">{{ c.content }}</div>
      </div>

      <div v-if="user.isLoggedIn" class="comment-form">
        <el-input
          v-model="commentText"
          type="textarea"
          :rows="3"
          placeholder="写下你的评论"
        />
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
  white-space: pre-wrap;
  line-height: 1.8;
  min-height: 120px;
}

.like {
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
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.comment-body {
  white-space: pre-wrap;
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
