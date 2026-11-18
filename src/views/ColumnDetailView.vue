<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Collection, Delete, Document, Edit, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import Http from '../api'
import ColumnSidebar from '../components/ColumnSidebar.vue'
import PanelBox from '../components/PanelBox.vue'
import { useUserStore } from '../stores/user'
import type { Column } from '../types/api'
import { confirmAction } from '../utils/confirm'

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const loading = ref(false)
const notFound = ref(false)
const column = ref<Column | null>(null)

const isOwner = computed(() => !!column.value && user.isLoggedIn && column.value.uid === user.uid)
const sidebarRef = ref<{ load: () => Promise<void> }>()

const editVisible = ref(false)
const editSaving = ref(false)
const editFormRef = ref<FormInstance>()
const editForm = reactive({ name: '' })
const editRules: FormRules = {
  name: [{ required: true, message: '专栏名必填', trigger: 'blur' }],
}

async function load() {
  loading.value = true
  notFound.value = false
  try {
    column.value = await Http<Column>({
      type: 'getColumnById',
      data: { id: String(route.params.id) },
    })
  } catch {
    column.value = null
    notFound.value = true
  } finally {
    loading.value = false
  }
}

function openEdit() {
  if (!column.value) return
  editForm.name = column.value.name
  editVisible.value = true
}

function submitEdit() {
  editFormRef.value?.validate(async (valid) => {
    if (!valid || !column.value) return
    editSaving.value = true
    try {
      const name = editForm.name.trim()
      await Http({ type: 'putColumn', data: { id: column.value._id, name } })
      column.value.name = name
      await sidebarRef.value?.load()
      ElMessage.success('专栏名已修改')
      editVisible.value = false
    } catch {
      // 错误（如名称重复）已由 Http 弹出提示
    } finally {
      editSaving.value = false
    }
  })
}

async function removeColumn() {
  if (!column.value) return
  // 级联：专栏下所有帖子（包括他人发表的）及这些帖子的评论都会被删除
  const ok = await confirmAction(
    '删除专栏会同时删除该专栏下的全部帖子（包括他人发表的帖子）以及这些帖子的评论，且无法恢复。确认删除？',
    '删除专栏',
    '删除',
  )
  if (!ok) return
  try {
    await Http({ type: 'deleteColumn', data: { id: column.value._id } })
    ElMessage.success('专栏已删除')
    router.push({ name: 'columns' })
  } catch {
    // 错误已由 Http 弹出提示
  }
}

function publish() {
  if (!column.value) return
  router.push({ name: 'article-create', query: { column: column.value._id } })
}

function openArticle(id: string) {
  router.push({ name: 'article-detail', params: { id } })
}

onMounted(load)
watch(() => route.params.id, load)
</script>

<template>
  <div class="column-page">
    <ColumnSidebar ref="sidebarRef" show-create />

    <main class="column-main">
      <el-skeleton v-if="loading" :rows="6" animated />
      <el-result v-else-if="notFound" icon="warning" title="专栏不存在或加载失败" />

      <template v-else-if="column">
        <section class="column-hero">
          <div class="hero-cover">
            <el-icon :size="34" aria-hidden="true"><Collection /></el-icon>
          </div>
          <div class="hero-text">
            <h1>{{ column.name }}</h1>
            <p>共 {{ column.aids?.length ?? 0 }} 篇帖子</p>
          </div>
          <div v-if="isOwner" class="hero-actions">
            <el-button class="action app-pill-btn" @click="publish">
              <el-icon><Plus /></el-icon>
              <span>发布帖子</span>
            </el-button>
            <el-button class="action app-pill-btn" @click="openEdit">
              <el-icon><Edit /></el-icon>
              <span>修改专栏名</span>
            </el-button>
            <el-button class="action app-pill-btn app-pill-danger" @click="removeColumn">
              <el-icon><Delete /></el-icon>
              <span>删除专栏</span>
            </el-button>
          </div>
        </section>

        <PanelBox title="帖子列表" :icon="Document" variant="hot">
          <el-empty v-if="!column.aids?.length" description="该专栏暂无帖子" />
          <ul v-else class="post-list">
            <li v-for="item in column.aids" :key="item._id">
              <button type="button" class="post-row" @click="openArticle(item._id)">
                <img v-if="item.cover" :src="item.cover" alt="" class="post-cover" loading="lazy" />
                <span v-else class="post-cover post-cover-empty">
                  <el-icon :size="22" aria-hidden="true"><Document /></el-icon>
                </span>
                <span class="post-main">
                  <span class="post-title">{{ item.title }}</span>
                  <span class="post-meta">
                    <span>阅读 {{ item.hit_num }}</span>
                    <span>评论 {{ item.comment_num }}</span>
                    <span>点赞 {{ item.like_num }}</span>
                  </span>
                </span>
                <span class="post-date">{{ item.date }}</span>
              </button>
            </li>
          </ul>
        </PanelBox>

        <el-dialog v-model="editVisible" title="修改专栏名" width="400px" append-to-body>
          <el-form
            ref="editFormRef"
            :model="editForm"
            :rules="editRules"
            label-position="top"
            @submit.prevent="submitEdit"
          >
            <el-form-item label="专栏名称" prop="name">
              <el-input v-model="editForm.name" placeholder="请填写专栏名称" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button class="action" @click="editVisible = false">取消</el-button>
            <el-button type="primary" class="action" :loading="editSaving" @click="submitEdit">
              保存
            </el-button>
          </template>
        </el-dialog>
      </template>
    </main>
  </div>
</template>

<style scoped>
.column-page {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 40px;
  align-items: start;
}

.column-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.column-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 20px 24px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--app-hot-gradient);
}

.hero-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 10px;
  background: var(--el-fill-color);
  color: var(--el-color-primary-light-3);
}

.hero-text {
  flex: 1;
  min-width: 0;
}

.hero-text h1 {
  margin: 0;
  color: var(--app-on-purple);
  font-size: 24px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.hero-text p {
  margin: 6px 0 0;
  color: var(--app-on-purple);
  font-size: 13px;
  opacity: 0.72;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-left: auto;
}

.action {
  min-height: 44px;
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

/* 与首页帖子卡片保持一致的悬停效果：上浮放大、金色边框、背景提亮 */
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
  width: 84px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--el-fill-color);
}

.post-cover-empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

.post-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 8px;
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

@media (prefers-reduced-motion: reduce) {
  .post-row:hover {
    transform: none;
  }
}

@media (max-width: 820px) {
  .column-page {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .column-main {
    gap: 16px;
  }

  .hero-actions {
    width: 100%;
    margin-left: 0;
  }

  .post-date {
    display: none;
  }
}
</style>
