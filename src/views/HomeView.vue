<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { Document, Trophy } from '@element-plus/icons-vue'
import Http from '../api'
import ColumnSidebar from '../components/ColumnSidebar.vue'
import HomeCarousel from '../components/HomeCarousel.vue'
import PanelBox from '../components/PanelBox.vue'
import type { ArticleBrief, Pagination } from '../types/api'

const PAGE_SIZE = 10
const HOT_LIMIT = 5
// 热门文章只能从列表接口取前 100 条后在前端排序，不是全站热门
const HOT_POOL = 100

const router = useRouter()

const page = ref(1)
const loading = ref(false)
const result = ref<Pagination<ArticleBrief> | null>(null)

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

onMounted(() => {
  void loadArticles()
  void loadHot()
})
</script>

<template>
  <div class="home">
    <div class="home-grid">
      <ColumnSidebar />

      <div class="center-column">
        <HomeCarousel />

        <PanelBox title="帖子列表" :icon="Document" variant="hot">
          <el-skeleton v-if="loading" :rows="3" animated />
          <el-empty v-else-if="result && result.list.length === 0" description="暂无帖子" />
          <template v-else>
            <el-card
              v-for="item in result?.list ?? []"
              :key="item._id"
              class="item"
              shadow="hover"
              @click="openArticle(item._id)"
            >
              <div class="item-body">
                <img v-if="item.cover" :src="item.cover" alt="" class="item-cover" loading="lazy" />
                <span v-else class="item-cover item-cover-empty">
                  <el-icon :size="26" aria-hidden="true"><Document /></el-icon>
                </span>
                <div class="item-main">
                  <div class="title">{{ item.title }}</div>
                  <div class="meta">
                    <span v-if="item.column">{{ item.column.name }}</span>
                    <span v-if="item.author">{{ item.author.nikname }}</span>
                    <span>阅读 {{ item.hit_num }}</span>
                    <span>评论 {{ item.comment_num }}</span>
                    <span>点赞 {{ item.like_num }}</span>
                  </div>
                </div>
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
          </template>
        </PanelBox>
      </div>

      <aside class="sidebar right">
        <PanelBox v-if="hot.length" title="Yes排行榜" :icon="Trophy" variant="rank">
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
                <span class="hot-main">
                  <span class="hot-title">{{ item.title }}</span>
                  <span class="hot-meta">阅读 {{ item.hit_num }}</span>
                </span>
              </button>
            </li>
          </ol>
        </PanelBox>
      </aside>
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
  gap: 40px;
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
  min-height: 56px;
  padding: 6px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font: inherit;
  font-size: 15px;
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
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 13px;
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

.hot-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.hot-title {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-meta {
  color: var(--el-text-color-secondary);
  font-size: 12px;
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

.item-body {
  display: flex;
  align-items: center;
  gap: 16px;
}

.item-cover {
  flex-shrink: 0;
  width: 160px;
  height: 96px;
  border-radius: 8px;
  background: var(--el-fill-color);
  object-fit: cover;
}

.item-cover-empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

.item-main {
  flex: 1;
  min-width: 0;
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

  .item-cover {
    width: 140px;
    height: 84px;
  }
}

@media (max-width: 600px) {
  .item-body {
    gap: 12px;
  }

  .item-cover {
    width: 112px;
    height: 72px;
  }

  .title {
    font-size: 15px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .item:hover {
    transform: none;
  }
}
</style>
