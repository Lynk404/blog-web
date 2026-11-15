<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Http from '../api'
import type { ArticleDetail } from '../types/api'

const route = useRoute()
const router = useRouter()

const article = ref<ArticleDetail | null>(null)
const loading = ref(false)
const notFound = ref(false)

// 注意：GET /api/rest/articles/:id 每次调用阅读数 +1，只在进入页面时请求一次
async function load() {
  loading.value = true
  notFound.value = false
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

      <h3 class="comments-title">评论（{{ article.comments?.length ?? 0 }}）</h3>
      <el-empty v-if="!article.comments?.length" description="暂无评论" />
      <div v-for="c in article.comments" :key="c._id" class="comment">
        <div class="comment-meta">{{ c.uid?.nikname ?? '匿名' }}</div>
        <div class="comment-body">{{ c.content }}</div>
      </div>
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
</style>
