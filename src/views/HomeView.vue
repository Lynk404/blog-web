<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import Http from '../api'
import type { ArticleBrief, Column, Pagination } from '../types/api'

const PAGE_SIZE = 10
const HOT_LIMIT = 5
// 热门文章只能从列表接口取前 100 条后在前端排序，不是全站热门
const HOT_POOL = 100

const router = useRouter()

const page = ref(1)
const loading = ref(false)
const result = ref<Pagination<ArticleBrief> | null>(null)

const columns = ref<Column[]>([])
const columnsLoading = ref(false)
const hot = ref<ArticleBrief[]>([])

async function loadArticles() {
  loading.value = true
  try {
    result.value = await Http<Pagination<ArticleBrief>>({
      type: 'articles',
      data: { page: page.value, size: PAGE_SIZE },
    })
  } catch {
    // 错误已由 Http 弹出提示
  } finally {
    loading.value = false
  }
}

async function loadColumns() {
  columnsLoading.value = true
  try {
    // 后端默认 size 为 100，与首页左栏展示上限一致
    const data = await Http<Pagination<Column>>({ type: 'columns' })
    columns.value = data.list
  } catch {
    // 错误已由 Http 弹出提示
  } finally {
    columnsLoading.value = false
  }
}

async function loadHot() {
  try {
    const data = await Http<Pagination<ArticleBrief>>({
      type: 'articles',
      data: { page: 1, size: HOT_POOL },
    })
    hot.value = [...data.list]
      .sort((a, b) => b.hit_num - a.hit_num || b.like_num - a.like_num)
      .slice(0, HOT_LIMIT)
  } catch {
    // 错误已由 Http 弹出提示
  }
}

function handlePageChange(next: number) {
  page.value = next
  void loadArticles()
}

function openArticle(id: string) {
  router.push({ name: 'article-detail', params: { id } })
}

function openColumn(id: string) {
  router.push({ name: 'column-detail', params: { id } })
}

onMounted(() => {
  void loadArticles()
  void loadColumns()
  void loadHot()
})
</script>

<template>
  <div class="home">
    <div class="home-grid">
      <aside class="sidebar left panel" aria-labelledby="columns-title">
        <div class="panel-head">
          <h2 id="columns-title">专栏</h2>
          <RouterLink :to="{ name: 'columns' }" class="more">全部专栏</RouterLink>
        </div>

        <div class="panel-body">
          <el-skeleton v-if="columnsLoading" :rows="4" animated />
          <el-empty v-else-if="columns.length === 0" description="暂无专栏" :image-size="60" />
          <ul v-else class="column-list">
            <li v-for="col in columns" :key="col._id">
              <button type="button" class="column-item" @click="openColumn(col._id)">
                <span class="column-name">{{ col.name }}</span>
                <span class="column-count">{{ col.aids?.length ?? 0 }} 篇</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <div class="center-column">
        <section v-if="hot.length" class="hot panel" aria-labelledby="hot-title">
          <div class="panel-head">
            <h2 id="hot-title" class="section-title">热门文章</h2>
          </div>
          <div class="panel-body">
            <ol class="hot-list">
              <li v-for="(item, index) in hot" :key="item._id">
                <button type="button" class="hot-item" @click="openArticle(item._id)">
                  <span
                    class="hot-rank"
                    :class="{
                      'is-gold': index === 0,
                      'is-silver': index === 1,
                      'is-bronze': index === 2,
                    }"
                  >
                    {{ index + 1 }}
                  </span>
                  <span class="hot-title">{{ item.title }}</span>
                  <span class="hot-meta">阅读 {{ item.hit_num }}</span>
                </button>
              </li>
            </ol>
          </div>
        </section>

        <section class="feed" aria-label="文章列表">
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

          <el-pagination
            v-if="result && result.total > 0"
            class="pager"
            layout="prev, pager, next, total"
            :current-page="page"
            :page-size="PAGE_SIZE"
            :total="result.total"
            @current-change="handlePageChange"
          />
        </section>
      </div>

      <aside class="sidebar right" aria-hidden="true"></aside>
    </div>

    <!-- /search 嵌套路由的出口：搜索弹窗以蒙版覆盖在当前页面上 -->
    <RouterView />
  </div>
</template>

<style scoped>
.home {
  width: 100%;
}

.home-grid {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 260px;
  gap: 24px;
  align-items: start;
}

.center-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.sidebar {
  min-width: 0;
}

.feed {
  min-width: 0;
}

.right {
  min-height: 1px;
}

.panel {
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--app-surface);
}

.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 16px;
  background: var(--app-purple-gradient);
}

.panel-head h2 {
  margin: 0;
  color: var(--app-on-purple);
  font-size: 15px;
  font-weight: 600;
}

.panel-body {
  padding: 8px;
}

.more {
  color: var(--app-on-purple);
  font-size: 12px;
  opacity: 0.78;
  text-decoration: none;
}

.more:hover {
  color: var(--el-color-primary-light-7);
  opacity: 1;
}

.column-list {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 180px);
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.column-list li + li {
  border-top: 1px solid var(--el-border-color-lighter);
}

.column-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  padding: 0 10px 0 12px;
  border: none;
  border-left: 2px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.column-item:hover {
  border-left-color: var(--el-color-primary);
  background: var(--app-gold-soft);
  color: var(--el-text-color-primary);
}

.column-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.column-count {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.feed {
  min-width: 0;
}

.hot .panel-head {
  background: var(--app-hot-gradient);
}

.section-title {
  margin: 0;
  color: var(--app-on-purple);
  font-size: 15px;
  font-weight: 600;
}

.hot-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.hot-list li + li {
  border-top: 1px solid var(--el-border-color-lighter);
}

.hot-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 44px;
  padding: 0 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.hot-item:hover {
  background: var(--app-gold-soft);
}

.hot-item:hover .hot-title {
  color: var(--el-color-primary-light-3);
}

.hot-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 600;
}

.hot-rank.is-gold {
  background: var(--el-color-primary);
  color: var(--app-on-gold);
}

.hot-rank.is-silver {
  background: var(--app-rank-silver);
  color: var(--app-on-rank);
}

.hot-rank.is-bronze {
  background: var(--app-rank-bronze);
  color: var(--app-on-rank);
}

.hot-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-meta {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
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

.item:hover .title {
  color: var(--el-color-primary-light-3);
}

.title {
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
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

@media (max-width: 1280px) {
  .home-grid {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .right {
    display: none;
  }
}

@media (max-width: 820px) {
  .home-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .center-column {
    gap: 16px;
  }

  .column-list {
    flex-direction: row;
    gap: 8px;
    max-height: none;
    padding-bottom: 4px;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .column-list li + li {
    border-top: none;
  }

  .column-item {
    min-width: 140px;
    padding: 0 10px;
    border: 1px solid var(--el-border-color-lighter);
  }
}

@media (prefers-reduced-motion: reduce) {
  .item:hover {
    transform: none;
  }
}
</style>
