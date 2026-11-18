<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowDown,
  ChatDotRound,
  Collection,
  Document,
  Edit,
  Files,
  Setting,
  Star,
} from '@element-plus/icons-vue'
import Http from '../api'
import PanelBox from '../components/PanelBox.vue'
import DeleteAccountDialog from '../components/profile/DeleteAccountDialog.vue'
import PasswordDialog from '../components/profile/PasswordDialog.vue'
import ProfileEditDialog from '../components/profile/ProfileEditDialog.vue'
import { useUserStore } from '../stores/user'
import type { ArticleBrief, Comment, Pagination } from '../types/api'
import { confirmLogout } from '../utils/logout'
import { refreshProfile } from '../utils/session'

const PAGE_SIZE = 10
// 获赞统计需要遍历本人全部帖子，列表接口单页上限为 100
const LIKE_PAGE_SIZE = 100

const router = useRouter()
const user = useUserStore()
const loading = ref(false)
const profile = computed(() => user.profile)
const avatarText = computed(() => profile.value?.nikname?.charAt(0) ?? '')
const uid = computed(() => profile.value?._id ?? '')

const editVisible = ref(false)
const passwordVisible = ref(false)
const deleteVisible = ref(false)

const tab = ref('posts')
const statsLoading = ref(false)
const commentTotal = ref(0)
const likeTotal = ref(0)

const posts = ref<Pagination<ArticleBrief> | null>(null)
const postsLoading = ref(false)
const postsPage = ref(1)

const comments = ref<Pagination<Comment> | null>(null)
const commentsLoading = ref(false)
const commentsLoaded = ref(false)
const commentsPage = ref(1)
// 评论只带帖子 id，标题按需查询并缓存
const articleTitles = ref<Record<string, string>>({})

async function handleLogout() {
  if (await confirmLogout()) {
    router.push({ name: 'home' })
  }
}

function handleAccountCommand(command: string) {
  if (command === 'password') passwordVisible.value = true
  else if (command === 'logout') void handleLogout()
  else if (command === 'delete') deleteVisible.value = true
}

async function loadLikeTotal(id: string) {
  let page = 1
  let pages = 1
  let likes = 0
  do {
    const result = await Http<Pagination<ArticleBrief>>({
      type: 'articles',
      data: { 'query[author]': id, page, size: LIKE_PAGE_SIZE },
    })
    likes += result.list.reduce((sum, item) => sum + (item.like_num ?? 0), 0)
    pages = result.pages
    page += 1
  } while (page <= pages)
  likeTotal.value = likes
}

async function loadStats() {
  const id = uid.value
  if (!id) return
  statsLoading.value = true
  const commentTask = Http<Pagination<Comment>>({
    type: 'comments',
    data: { 'query[uid]': id, page: 1, size: 1 },
  })
    .then((result) => {
      commentTotal.value = result.total
    })
    .catch(() => undefined)
  const likeTask = loadLikeTotal(id).catch(() => undefined)
  await Promise.all([commentTask, likeTask])
  statsLoading.value = false
}

async function loadPosts() {
  const id = uid.value
  if (!id) return
  postsLoading.value = true
  try {
    posts.value = await Http<Pagination<ArticleBrief>>({
      type: 'articles',
      data: { 'query[author]': id, page: postsPage.value, size: PAGE_SIZE },
    })
  } catch {
    // 错误已由 Http 弹出提示
  } finally {
    postsLoading.value = false
  }
}

async function loadArticleTitles(ids: string[]) {
  const missing = [...new Set(ids)].filter((id) => !(id in articleTitles.value))
  await Promise.all(
    missing.map(async (id) => {
      try {
        const result = await Http<Pagination<ArticleBrief>>({
          type: 'articles',
          data: { page: 1, size: 1, query: { _id: id } },
        })
        articleTitles.value[id] = result.list[0]?.title ?? '帖子已删除'
      } catch {
        articleTitles.value[id] = '帖子不可用'
      }
    }),
  )
}

async function loadComments() {
  const id = uid.value
  if (!id) return
  commentsLoading.value = true
  try {
    const result = await Http<Pagination<Comment>>({
      type: 'comments',
      data: { 'query[uid]': id, page: commentsPage.value, size: PAGE_SIZE },
    })
    comments.value = result
    commentsLoaded.value = true
    await loadArticleTitles(result.list.flatMap((item) => (item.aid ? [item.aid] : [])))
  } catch {
    // 错误已由 Http 弹出提示
  } finally {
    commentsLoading.value = false
  }
}

function handlePostsPageChange(next: number) {
  postsPage.value = next
  void loadPosts()
}

function handleCommentsPageChange(next: number) {
  commentsPage.value = next
  void loadComments()
}

function openArticle(id: string) {
  router.push({ name: 'article-detail', params: { id } })
}

watch(tab, (value) => {
  if (value === 'comments' && !commentsLoaded.value) void loadComments()
})

onMounted(async () => {
  loading.value = true
  try {
    // 始终刷新，拿到最新的帖子数与专栏数
    await refreshProfile()
  } catch {
    // 401 已由拦截器处理；其他错误保留空状态
  } finally {
    loading.value = false
  }
  if (!profile.value) return
  void loadStats()
  void loadPosts()
})
</script>

<template>
  <div class="profile">
    <el-skeleton v-if="loading && !profile" :rows="6" animated />
    <el-empty v-else-if="!profile" description="无法加载个人信息" />

    <template v-else>
      <section class="profile-card">
        <el-avatar :size="88" :src="profile.avatar" class="avatar">{{ avatarText }}</el-avatar>
        <div class="profile-main">
          <h1 class="nickname">{{ profile.nikname }}</h1>
          <p class="signature" :title="profile.signature || undefined">
            {{ profile.signature || '这个人很神秘，还没有填写签名' }}
          </p>
          <ul class="stats">
            <li>
              <el-icon :size="18" aria-hidden="true"><Document /></el-icon>
              <span class="stat-value">{{ profile.articleCount }}</span>
              <span class="stat-label">帖子</span>
            </li>
            <li>
              <el-icon :size="18" aria-hidden="true"><ChatDotRound /></el-icon>
              <span class="stat-value">{{ statsLoading ? '–' : commentTotal }}</span>
              <span class="stat-label">评论</span>
            </li>
            <li>
              <el-icon :size="18" aria-hidden="true"><Star /></el-icon>
              <span class="stat-value">{{ statsLoading ? '–' : likeTotal }}</span>
              <span class="stat-label">获赞</span>
            </li>
            <li>
              <el-icon :size="18" aria-hidden="true"><Collection /></el-icon>
              <span class="stat-value">{{ profile.columnCount }}</span>
              <span class="stat-label">专栏</span>
            </li>
          </ul>
        </div>
        <div class="profile-actions">
          <el-button class="action app-pill-btn" @click="editVisible = true">
            <el-icon><Edit /></el-icon>
            <span>编辑资料</span>
          </el-button>
          <el-dropdown trigger="click" @command="handleAccountCommand">
            <el-button class="action app-pill-btn">
              <el-icon><Setting /></el-icon>
              <span>账号设置</span>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                <el-dropdown-item command="delete" divided>注销账号</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </section>

      <PanelBox title="我的内容" :icon="Files" variant="plain">
        <el-tabs v-model="tab" class="content-tabs">
          <el-tab-pane label="发布的帖子" name="posts">
            <el-skeleton v-if="postsLoading && !posts" :rows="4" animated />
            <el-empty
              v-else-if="!posts?.list.length"
              :image-size="80"
              description="暂无发布的帖子"
            />

            <template v-else>
              <ul class="post-list">
                <li v-for="item in posts.list" :key="item._id">
                  <button type="button" class="post-row" @click="openArticle(item._id)">
                    <img
                      v-if="item.cover"
                      :src="item.cover"
                      alt=""
                      class="post-cover"
                      loading="lazy"
                    />
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
                :current-page="postsPage"
                :page-size="PAGE_SIZE"
                :total="posts.total"
                @current-change="handlePostsPageChange"
              />
            </template>
          </el-tab-pane>

          <el-tab-pane label="我的评论" name="comments" lazy>
            <el-skeleton v-if="commentsLoading" :rows="4" animated />
            <el-empty v-else-if="!comments?.list.length" :image-size="80" description="暂无评论" />

            <template v-else>
              <ul class="comment-list">
                <li v-for="item in comments.list" :key="item._id" class="comment-row">
                  <p class="comment-text">{{ item.content }}</p>
                  <div class="comment-meta">
                    <RouterLink
                      v-if="item.aid"
                      class="comment-article"
                      :to="{ name: 'article-detail', params: { id: item.aid } }"
                    >
                      评论了《{{ articleTitles[item.aid] ?? '加载中…' }}》
                    </RouterLink>
                    <span class="comment-date">{{ item.date }}</span>
                  </div>
                </li>
              </ul>

              <el-pagination
                class="pager"
                layout="prev, pager, next, total"
                :current-page="commentsPage"
                :page-size="PAGE_SIZE"
                :total="comments.total"
                @current-change="handleCommentsPageChange"
              />
            </template>
          </el-tab-pane>
        </el-tabs>
      </PanelBox>

      <ProfileEditDialog v-model="editVisible" :profile="profile" />
      <PasswordDialog v-model="passwordVisible" />
      <DeleteAccountDialog v-model="deleteVisible" />
    </template>
  </div>
</template>

<style scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 960px;
  padding-bottom: 48px;
}

.profile-card {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 28px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--app-surface);
  box-shadow: var(--app-panel-shadow);
}

.avatar {
  flex-shrink: 0;
  background: var(--app-gold-soft);
  color: var(--el-color-primary-light-3);
  font-size: 32px;
}

.profile-main {
  flex: 1;
  min-width: 0;
}

.nickname {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 26px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.signature {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}

.stats li {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 48px;
  color: var(--el-color-primary-light-3);
}

.stat-value {
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 600;
}

.stat-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.action {
  min-height: 44px;
}

.profile-actions {
  display: flex;
  flex-wrap: wrap;
  flex-shrink: 0;
  gap: 12px;
}

.content-tabs :deep(.el-tabs__header) {
  margin: 0 0 8px;
}

.content-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: var(--el-border-color-lighter);
}

.content-tabs :deep(.el-tabs__item) {
  min-height: 44px;
  color: var(--el-text-color-secondary);
  font-size: 15px;
}

.content-tabs :deep(.el-tabs__item:hover),
.content-tabs :deep(.el-tabs__item.is-active) {
  color: var(--el-color-primary-light-3);
}

.content-tabs :deep(.el-tabs__active-bar) {
  background-color: var(--el-color-primary);
}

.post-list,
.comment-list {
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

.comment-row {
  padding: 14px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.comment-row:first-child {
  padding-top: 4px;
}

.comment-text {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.comment-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.comment-article {
  color: var(--el-color-primary-light-3);
  text-decoration: none;
}

.comment-article:hover {
  text-decoration: underline;
}

.pager {
  justify-content: center;
  margin-top: 16px;
}

@media (max-width: 820px) {
  .profile {
    gap: 16px;
  }

  .post-date {
    display: none;
  }
}

@media (max-width: 600px) {
  .profile-card {
    flex-wrap: wrap;
    gap: 16px;
    padding: 18px;
  }

  .nickname {
    font-size: 22px;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 16px;
  }

  .profile-actions {
    width: 100%;
  }

  .profile-actions .action,
  .profile-actions :deep(.el-dropdown) {
    flex: 1;
  }

  .profile-actions :deep(.el-dropdown .el-button) {
    width: 100%;
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
