<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import Http from '../api'
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
  // 级联：专栏下所有文章（包括他人发表的）及这些文章的评论都会被删除
  const ok = await confirmAction(
    '删除专栏会同时删除该专栏下的全部文章（包括他人发表的文章）以及这些文章的评论，且无法恢复。确认删除？',
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

onMounted(load)
watch(() => route.params.id, load)
</script>

<template>
  <div class="column-detail">
    <el-button link class="back" @click="router.back()">← 返回</el-button>
    <el-skeleton v-if="loading" :rows="4" animated />
    <el-result v-else-if="notFound" icon="warning" title="专栏不存在或加载失败" />
    <template v-else-if="column">
      <div class="header">
        <h2>{{ column.name }}</h2>
        <div v-if="isOwner" class="owner-actions">
          <el-button class="action" @click="openEdit">修改专栏名</el-button>
          <el-button class="action" type="danger" plain @click="removeColumn">删除专栏</el-button>
        </div>
      </div>

      <el-empty v-if="!column.aids?.length" description="该专栏暂无文章" />
      <el-card
        v-for="item in column.aids ?? []"
        :key="item._id"
        class="item"
        shadow="hover"
        @click="router.push({ name: 'article-detail', params: { id: item._id } })"
      >
        <div class="title">{{ item.title }}</div>
        <div class="meta">
          <span v-if="item.author">{{ item.author.nikname }}</span>
          <span>阅读 {{ item.hit_num }}</span>
        </div>
      </el-card>

      <el-dialog v-model="editVisible" title="修改专栏名" width="400px">
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
  </div>
</template>

<style scoped>
.back {
  margin-bottom: 12px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.header h2 {
  margin: 0;
}

.owner-actions {
  display: flex;
  gap: 12px;
}

.action {
  min-height: 44px;
}

.item {
  margin-bottom: 12px;
  cursor: pointer;
}

.title {
  font-weight: 600;
  margin-bottom: 6px;
}

.meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
