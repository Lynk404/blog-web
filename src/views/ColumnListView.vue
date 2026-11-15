<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import Http from '../api'
import { useUserStore } from '../stores/user'
import type { Column, Pagination } from '../types/api'

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

const hasColumns = computed(() => columns.value.length > 0)

async function load() {
  loading.value = true
  try {
    const result = await Http<Pagination<Column>>({ type: 'columns' })
    columns.value = result.list
  } finally {
    loading.value = false
  }
}

function openCreate() {
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
  <div class="columns">
    <div class="header">
      <h2>专栏</h2>
      <el-button v-if="user.isLoggedIn" type="primary" class="action" @click="openCreate">
        新建专栏
      </el-button>
    </div>

    <el-skeleton v-if="loading" :rows="3" animated />
    <el-empty v-else-if="!hasColumns" description="暂无专栏" />
    <el-card
      v-for="col in columns"
      :key="col._id"
      class="item"
      shadow="hover"
      @click="router.push({ name: 'column-detail', params: { id: col._id } })"
    >
      <div class="name">{{ col.name }}</div>
      <div class="meta">文章 {{ col.aids?.length ?? 0 }} 篇</div>
    </el-card>

    <el-dialog v-model="createVisible" title="新建专栏" width="400px">
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-position="top"
        @submit.prevent="submitCreate"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请填写分类名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="action" @click="createVisible = false">取消</el-button>
        <el-button type="primary" class="action" :loading="creating" @click="submitCreate">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.header h2 {
  margin: 0;
}

.action {
  min-height: 44px;
}

.item {
  margin-bottom: 12px;
  cursor: pointer;
}

.name {
  font-size: 16px;
  font-weight: 600;
}

.meta {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 6px;
}
</style>
