<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import Http from '../api'
import { useUserStore } from '../stores/user'
import type { Column, Pagination, ArticleDetail } from '../types/api'

// 编辑器体积较大，懒加载
const MarkdownEditor = defineAsyncComponent(() => import('../components/MarkdownEditor.vue'))

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const loading = ref(false)
const columns = ref<Column[]>([])
const form = reactive({ title: '', column: '', content: '' })

// 路由 articles/:id/edit 为编辑模式，同一页面复用
const articleId = computed(() => (route.name === 'article-edit' ? String(route.params.id) : ''))
const isEdit = computed(() => articleId.value !== '')
const editDenied = ref(false)
const editNotFound = ref(false)

// 后端只允许发布到本人专栏（他人专栏返回 403）；列表取前 100 条，超出部分需后续分页支持
const myColumns = computed(() => columns.value.filter((c) => c.uid === user.uid))

const rules: FormRules = {
  title: [{ required: true, message: '标题必填', trigger: 'blur' }],
  column: [{ required: true, message: '请选择专栏', trigger: 'change' }],
  content: [{ required: true, message: '内容必填', trigger: 'change' }],
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

// 编辑时用列表接口按 _id 取数：GET /api/rest/articles/:id 每次会阅读数 +1，不能用于编辑页
async function loadArticle() {
  if (!isEdit.value) return
  loading.value = true
  editDenied.value = false
  editNotFound.value = false
  try {
    const result = await Http<Pagination<ArticleDetail>>({
      type: 'articles',
      data: { page: 1, size: 1, query: { _id: articleId.value } },
    })
    const item = result.list[0]
    if (!item) {
      editNotFound.value = true
    } else if (item.author?._id !== user.uid) {
      editDenied.value = true
    } else {
      form.title = item.title
      form.column = item.column?._id ?? ''
      form.content = item.content
    }
  } catch {
    editNotFound.value = true
  } finally {
    loading.value = false
  }
}

function submit() {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      // 服务端会对 content 做 decodeURIComponent（接口约定），因此发送前需编码
      if (isEdit.value) {
        await Http({
          type: 'putArticle',
          data: {
            id: articleId.value,
            title: form.title.trim(),
            content: encodeURIComponent(form.content),
          },
        })
        ElMessage.success('修改成功')
        router.push({ name: 'article-detail', params: { id: articleId.value } })
      } else {
        const result = await Http<{ id: string }>({
          type: 'postArticle',
          data: {
            title: form.title.trim(),
            content: encodeURIComponent(form.content),
            column: form.column,
          },
        })
        ElMessage.success('发布成功')
        router.push({ name: 'article-detail', params: { id: result.id } })
      }
    } catch {
      // 错误已由 Http 弹出提示
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => {
  void loadColumns()
  void loadArticle()
})
// 同一组件在 /articles/:id/edit 之间切换时重新取数
watch(articleId, () => void loadArticle())
</script>

<template>
  <div class="create">
    <h2 class="heading">{{ isEdit ? '编辑文章' : '发布文章' }}</h2>

    <el-skeleton v-if="loading" :rows="4" animated />

    <el-result v-else-if="editNotFound" icon="warning" title="文章不存在或加载失败" />
    <el-result v-else-if="editDenied" icon="error" title="无权编辑该文章" />

    <template v-else>
      <el-empty v-if="!isEdit && myColumns.length === 0" description="你还没有专栏">
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
          <!-- 后端不允许修改文章所属专栏，编辑时只读 -->
          <el-select
            v-model="form.column"
            placeholder="选择本人专栏"
            class="column-select"
            :disabled="isEdit"
          >
            <el-option
              v-for="col in isEdit ? columns : myColumns"
              :key="col._id"
              :label="col.name"
              :value="col._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="正文（支持 Markdown）" prop="content">
          <MarkdownEditor v-model="form.content" height="480px" />
        </el-form-item>
        <el-button type="primary" class="submit" native-type="submit" :loading="submitting">
          {{ isEdit ? '保存' : '发布' }}
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
