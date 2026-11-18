<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Document } from '@element-plus/icons-vue'
import Http from '../api'
import PanelBox from '../components/PanelBox.vue'
import { useUserStore } from '../stores/user'
import type { ArticleBrief, Pagination, PublicUser } from '../types/api'

const PAGE_SIZE = 10

const route = useRoute()
const router = useRouter()
const user = useUserStore()

const loading = ref(true)
const notFound = ref(false)
const profile = ref<PublicUser | null>(null)
const posts = ref<Pagination<ArticleBrief> | null>(null)
const postsLoading = ref(false)
const page = ref(1)

const userId = computed(() => String(route.params.id ?? ''))
const isSelf = computed(() => user.isLoggedIn && profile.value?._id === user.uid)
const avatarText = computed(() => profile.value?.nikname?.charAt(0) ?? '')

async function loadProfile() {
  loading.value = true
  notFound.value = false
  profile.value = null
  posts.value = null
  page.value = 1
  try {
    profile.value = await Http<PublicUser>({
      type: 'getUserById',
      data: { id: userId.value },
    })
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
  if (profile.value) await loadPosts()
}

async function loadPosts() {
  postsLoading.value = true
  try {
    posts.value = await Http<Pagination<ArticleBrief>>({
      type: 'articles',
      // 后端通过 qs 解析嵌套查询：query[author]=<uid>
      data: { 'query[author]': userId.value, page: page.value, size: PAGE_SIZE },
    })
  } catch {
    // 错误已由 Http 弹出提示
  } finally {
    postsLoading.value = false
  }
}

function handlePageChange(next: number) {
  page.value = next
  void loadPosts()
}

function openArticle(id: string) {
  router.push({ name: 'article-detail', params: { id } })
}

onMounted(loadProfile)
watch(() => route.params.id, loadProfile)
</script>

<template>
  <div class="user-page">
    <el-skeleton v-if="loading" :rows="6" animated />
    <el-result v-else-if="notFound" icon="warning" title="用户不存在或加载失败" />

    <template v-else-if="profile">
      <section class="profile-card">
        <el-avatar :size="72" :src="profile.avatar" class="avatar">{{ avatarText }}</el-avatar>
        <div class="profile-main">
          <h1>{{ profile.nikname }}</h1>
          <p class="signature">{{ profile.signature || '这个人很神秘，还没有填写签名' }}</p>
        </div>
        <el-button
          v-if="isSelf"
          type="primary"
          class="action"
          @click="router.push({ name: 'profile' })"
        >
          编辑资料
        </el-button>
      </section>

      <PanelBox title="TA 的帖子" :icon="Document" variant="plain">
        <template #actions>
          <span class="post-count">共 {{ posts?.total ?? 0 }} 篇</span>
        </template>

        <el-skeleton v-if="postsLoading || !posts" :rows="4" animated />
        <el-empty
          v-else-if="posts.list.length === 0"
          :image-size="80"
          description="该用户还没有发布帖子"
        />

        <template v-else>
          <ul class="post-list">
            <li v-for="item in posts.list" :key="item._id">
              <button type="button" class="post-row" @click="openArticle(item._id)">
                <img v-if="item.cover" :src="item.cover" alt="" class="post-cover" loading="lazy" />
                <span v-else class="post-cover post-cover-empty">
                  <el-icon :size="22" aria-hidden="true"><Document /></el-icon>
                </span>
                <span class="post-main">
                  <span class="post-title">{{ item.title }}</span>
                  <span class="post-meta">
                    <span v-if="item.column">{{ item.column.name }}</span>
                    <span>阅读 {{ item.hit_num }}</span>
                    <span>评论 {{ item.comment_num }}</span>
                    <span>点赞 {{ item.like_num }}</span>
                  </span>
                </span>
                <span class="post-date">{{ item.date }}</span>
              </button>
            </li>
          </ul>

          <el-pagination
            v-if="posts.total > 0"
            class="pager"
            layout="prev, pager, next, total"
            :current-page="page"
            :page-size="PAGE_SIZE"
            :total="posts.total"
            @current-change="handlePageChange"
          />
        </template>
      </PanelBox>
    </template>
  </div>
</template>

<style scoped>
.user-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

.profile-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--app-surface);
  box-shadow: var(--app-panel-shadow);
}

.avatar {
  flex-shrink: 0;
  background: var(--app-gold-soft);
  color: var(--el-color-primary-light-3);
  font-size: 24px;
}

.profile-main {
  flex: 1;
  min-width: 0;
}

.profile-main h1 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.signature {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.action {
  min-height: 44px;
}

.post-count {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.post-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.post-list li + li {
  border-top: 1px solid var(--el-border-color-lighter);
}

.post-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 12px 8px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;
}

/* 与首页帖子卡片保持一致的悬停效果 */
.post-row:hover {
  border-color: var(--el-color-primary);
  background: var(--app-surface-hover);
  transform: translateY(-2px) scale(1.015);
}

.post-row:hover .post-title {
  color: var(--el-color-primary-light-3);
}

.post-cover {
  flex-shrink: 0;
  width: 120px;
  height: 80px;
  border-radius: 8px;
  background: var(--el-fill-color);
  object-fit: cover;
}

.post-cover-empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

.post-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.post-title {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.post-date {
  flex-shrink: 0;
  margin-left: auto;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.pager {
  justify-content: center;
  margin-top: 16px;
}

@media (max-width: 820px) {
  .user-page {
    gap: 16px;
  }

  .post-date {
    display: none;
  }
}

@media (max-width: 600px) {
  .profile-card {
    padding: 18px;
  }

  .post-cover {
    width: 96px;
    height: 64px;
  }

  .post-title {
    font-size: 15px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .post-row:hover {
    transform: none;
  }
}
</style>
