<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Collection, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import Http from '../api'
import { useUserStore } from '../stores/user'
import type { Column, Pagination } from '../types/api'
import PanelBox from './PanelBox.vue'

withDefaults(defineProps<{ showCreate?: boolean }>(), { showCreate: false })
const emit = defineEmits<{ created: [] }>()

const route = useRoute()
const router = useRouter()
const user = useUserStore()

const loading = ref(false)
const columns = ref<Column[]>([])

const createVisible = ref(false)
const creating = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive({ name: '' })
const createRules: FormRules = {
  name: [{ required: true, message: '专栏名必填', trigger: 'blur' }],
}

async function load() {
  loading.value = true
  try {
    const result = await Http<Pagination<Column>>({ type: 'columns' })
    columns.value = result.list
  } catch {
    // 错误已由 Http 弹出提示
  } finally {
    loading.value = false
  }
}

defineExpose({ load })

function openColumn(id: string) {
  router.push({ name: 'column-detail', params: { id } })
}

function openCreate() {
  if (!user.isLoggedIn) {
    ElMessage.warning('请先登录后再新建专栏')
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  createForm.name = ''
  createVisible.value = true
}

function submitCreate() {
  createFormRef.value?.validate(async (valid) => {
    if (!valid) return
    creating.value = true
    try {
      await Http({ type: 'postColumn', data: { name: createForm.name.trim() } })
      ElMessage.success('专栏已创建')
      createVisible.value = false
      await load()
      emit('created')
    } catch {
      // 错误（如名称重复）已由 Http 弹出提示
    } finally {
      creating.value = false
    }
  })
}

onMounted(load)
</script>

<template>
  <PanelBox title="专栏" :icon="Collection" class="column-sidebar">
    <template #actions>
      <RouterLink :to="{ name: 'columns' }" class="more">全部专栏</RouterLink>
    </template>

    <el-skeleton v-if="loading" :rows="4" animated />
    <el-empty v-else-if="columns.length === 0" description="暂无专栏" :image-size="60" />
    <ul v-else class="column-list">
      <li v-for="col in columns" :key="col._id">
        <button type="button" class="column-item" @click="openColumn(col._id)">
          <span class="column-name">{{ col.name }}</span>
          <span class="column-count">{{ col.aids?.length ?? 0 }} 篇</span>
        </button>
      </li>
    </ul>

    <button v-if="showCreate" type="button" class="add-column" @click="openCreate">
      <el-icon :size="16"><Plus /></el-icon>
      <span>新建专栏</span>
    </button>

    <el-dialog v-model="createVisible" title="新建专栏" width="400px" append-to-body>
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-position="top"
        @submit.prevent="submitCreate"
      >
        <el-form-item label="专栏名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请填写专栏名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="action" @click="createVisible = false">取消</el-button>
        <el-button type="primary" class="action" :loading="creating" @click="submitCreate">
          创建
        </el-button>
      </template>
    </el-dialog>
  </PanelBox>
</template>

<style scoped>
.column-sidebar {
  min-width: 0;
}

.more {
  color: var(--app-on-purple);
  font-size: 13px;
  opacity: 0.78;
  text-decoration: none;
}

.more:hover {
  opacity: 1;
}

.column-list {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 220px);
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
  min-height: 52px;
  padding: 0 10px 0 12px;
  border: none;
  border-left: 2px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font: inherit;
  font-size: 15px;
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
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.add-column {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-height: 52px;
  margin-top: 8px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s,
    background-color 0.2s;
}

.add-column:hover {
  border-color: var(--el-color-primary);
  background: var(--app-gold-soft);
  color: var(--el-color-primary-light-3);
}

.action {
  min-height: 44px;
}

@media (max-width: 820px) {
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
</style>
