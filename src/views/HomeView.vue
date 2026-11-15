<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Http from '../api'
import { useUserStore } from '../stores/user'
import type { ArticleBrief, Pagination } from '../types/api'

const PAGE_SIZE = 10
const router = useRouter()
const user = useUserStore()

const keyword = ref('')
const page = ref(1)
const loading = ref(false)
const result = ref<Pagination<ArticleBrief> | null>(null)

async function load() {
  loading.value = true
  try {
    const q = keyword.value.trim()
    // 有关键词走搜索接口，否则走文章列表
    result.value = q
      ? await Http<Pagination<ArticleBrief>>({
          type: 'search',
          data: { page: page.value, size: PAGE_SIZE, query: { q } },
        })
      : await Http<Pagination<ArticleBrief>>({
          type: 'articles',
          data: { page: page.value, size: PAGE_SIZE },
        })
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  load()
}

function handlePageChange(next: number) {
  page.value = next
  load()
}

function openArticle(id: string) {
  router.push({ name: 'article-detail', params: { id } })
}

onMounted(load)
</script>

<template>
  <div class="home">
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索标题或正文"
        clearable
        class="search"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button v-if="user.isLoggedIn" class="write" @click="router.push({ name: 'article-create' })">
        写文章
      </el-button>
    </div>

    <div class="list">
      <el-skeleton v-if="loading" :rows="3" animated />
      <el-empty v-else-if="result && result.list.length === 0" description="暂无文章" />
      <el-card
        v-for="item in result?.list ?? []"
        :key="item._id"
        class="item"
        shadow="hover"
        @click="openArticle(item._id)"
      >
        <div class="title">{{ item.title }}</div>
        <div class="meta">
          <span v-if="item.column">{{ item.column.name }}</span>
          <span v-if="item.author">{{ item.author.nikname }}</span>
          <span>阅读 {{ item.hit_num }}</span>
          <span>评论 {{ item.comment_num }}</span>
          <span>点赞 {{ item.like_num }}</span>
        </div>
      </el-card>
    </div>

    <el-pagination
      v-if="result && result.total > 0"
      class="pager"
      layout="prev, pager, next, total"
      :current-page="page"
      :page-size="PAGE_SIZE"
      :total="result.total"
      @current-change="handlePageChange"
    />
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search {
  flex: 1;
}

.write {
  min-height: 44px;
}

.item {
  margin-bottom: 12px;
  cursor: pointer;
}

.title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.pager {
  margin-top: 16px;
  justify-content: center;
}
</style>
