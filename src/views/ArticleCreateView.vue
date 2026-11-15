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
const formRef = ref<FormInstance>()
const submitting = ref(false)
const loading = ref(false)
const columns = ref<Column[]>([])
const form = reactive({ title: '', column: '', content: '' })

// 后端只允许发布到本人专栏（他人专栏返回 403）；列表取前 100 条，超出部分需后续分页支持
const myColumns = computed(() => columns.value.filter((c) => c.uid === user.uid))

const rules: FormRules = {
  title: [{ required: true, message: '标题必填', trigger: 'blur' }],
  column: [{ required: true, message: '请选择专栏', trigger: 'change' }],
  content: [{ required: true, message: '内容必填', trigger: 'blur' }],
}

async function loadColumns() {
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

function submit() {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const result = await Http<{ id: string }>({
        type: 'postArticle',
        // 服务端会对 content 做 decodeURIComponent（接口约定），因此发送前需编码
        data: {
          title: form.title.trim(),
          content: encodeURIComponent(form.content),
          column: form.column,
        },
      })
      ElMessage.success('发布成功')
      router.push({ name: 'article-detail', params: { id: result.id } })
    } catch {
      // 错误已由 Http 弹出提示
    } finally {
      submitting.value = false
    }
  })
}

onMounted(loadColumns)
</script>

<template>
  <div class="create">
    <h2 class="heading">发布文章</h2>

    <el-skeleton v-if="loading" :rows="4" animated />

    <template v-else>
      <el-empty v-if="myColumns.length === 0" description="你还没有专栏">
        <RouterLink :to="{ name: 'columns' }">前往专栏页新建专栏</RouterLink>
      </el-empty>

      <el-form
        v-else
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submit"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文章标题" />
        </el-form-item>
        <el-form-item label="专栏" prop="column">
          <el-select v-model="form.column" placeholder="选择本人专栏" class="column-select">
            <el-option v-for="col in myColumns" :key="col._id" :label="col.name" :value="col._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="正文" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="16" placeholder="请输入正文" />
        </el-form-item>
        <el-button type="primary" class="submit" native-type="submit" :loading="submitting">
          发布
        </el-button>
      </el-form>
    </template>
  </div>
</template>

<style scoped>
.heading {
  margin: 0 0 20px;
}

.column-select {
  width: 100%;
}

.submit {
  min-height: 44px;
}
</style>
