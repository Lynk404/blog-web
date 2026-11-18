<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Http from '../api'
import type { ArticleBrief, Pagination } from '../types/api'

const PAGE_SIZE = 10

const route = useRoute()
const router = useRouter()

const visible = ref(true)
const keyword = ref(String(route.query.q ?? ''))
const page = ref(1)
const loading = ref(false)
const searched = ref(false)
const result = ref<Pagination<ArticleBrief> | null>(null)
const inputRef = ref<{ focus: () => void }>()

async function load() {
  const q = keyword.value.trim()
  if (!q) {
    searched.value = false
    result.value = null
    return
  }
  searched.value = true
  loading.value = true
  try {
    result.value = await Http<Pagination<ArticleBrief>>({
      type: 'search',
      data: { page: page.value, size: PAGE_SIZE, query: { q } },
    })
  } catch {
    // 错误已由 Http 弹出提示
    result.value = null
  } finally {
    loading.value = false
  }
}

function submit() {
  const q = keyword.value.trim()
  page.value = 1
  void router.replace(q ? { name: 'search', query: { q } } : { name: 'search' })
  void load()
}

function handlePageChange(next: number) {
  page.value = next
  void load()
}

function openArticle(id: string) {
  router.push({ name: 'article-detail', params: { id } })
}

function close() {
  visible.value = false
  if (route.name === 'search') {
    router.push({ name: 'home' })
  }
}

function focusInput() {
  inputRef.value?.focus()
}

onMounted(() => {
  if (keyword.value.trim()) void load()
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="搜索帖子"
    width="min(720px, 92vw)"
    top="10vh"
    append-to-body
    @opened="focusInput"
    @closed="close"
  >
    <div class="search-bar">
      <el-input
        ref="inputRef"
        v-model="keyword"
        placeholder="搜索标题或正文"
        clearable
        @keyup.enter="submit"
        @clear="submit"
      />
      <el-button type="primary" class="action" @click="submit">搜索</el-button>
    </div>

    <el-skeleton v-if="loading" :rows="3" animated />
    <el-empty v-else-if="!searched" description="输入关键词开始搜索" :image-size="70" />
    <el-empty
      v-else-if="result && result.list.length === 0"
      description="没有找到相关帖子"
      :image-size="70"
    />
    <template v-else-if="result">
      <el-card
        v-for="item in result.list"
        :key="item._id"
        class="item"
        shadow="hover"
        @click="openArticle(item._id)"
      >
        <div class="item-body">
          <img v-if="item.cover" :src="item.cover" alt="" class="item-cover" loading="lazy" />
          <div class="item-main">
            <div class="title">{{ item.title }}</div>
            <div class="meta">
              <span v-if="item.column">{{ item.column.name }}</span>
              <span v-if="item.author">{{ item.author.nikname }}</span>
              <span>阅读 {{ item.hit_num }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <el-pagination
        v-if="result.total > 0"
        class="pager"
        layout="prev, pager, next, total"
        :current-page="page"
        :page-size="PAGE_SIZE"
        :total="result.total"
        @current-change="handlePageChange"
      />
    </template>
  </el-dialog>
</template>

<style scoped>
.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.action {
  min-height: 44px;
}

.item {
  margin-bottom: 12px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.item:hover {
  transform: translateY(-2px) scale(1.015);
}

.item-body {
  display: flex;
  align-items: center;
  gap: 14px;
}

.item-cover {
  flex-shrink: 0;
  width: 120px;
  height: 80px;
  border-radius: 8px;
  background: var(--el-fill-color);
  object-fit: cover;
}

.item-main {
  flex: 1;
  min-width: 0;
}

.title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
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

@media (max-width: 600px) {
  .item-body {
    gap: 10px;
  }

  .item-cover {
    width: 96px;
    height: 64px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .item:hover {
    transform: none;
  }
}
</style>
