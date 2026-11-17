<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadRequestOptions } from 'element-plus'
import { ElMessage } from 'element-plus'
import Http from '../api'
import {
  IMAGE_ACCEPT,
  IMAGE_MAX_SIZE,
  IMAGE_MAX_SIZE_LABEL,
  IMAGE_TYPES,
} from '../config/upload.config'
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
const form = reactive({ title: '', column: '', content: '', cover: '' })
const coverUploading = ref(false)

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

function beforeCover(file: File): boolean {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    ElMessage.error('封面仅支持 jpg、png、gif、webp 格式')
    return false
  }
  if (file.size > IMAGE_MAX_SIZE) {
    ElMessage.error(`封面大小不能超过 ${IMAGE_MAX_SIZE_LABEL}`)
    return false
  }
  return true
}

async function uploadCover(options: UploadRequestOptions) {
  coverUploading.value = true
  try {
    const data = new FormData()
    data.append('file', options.file)
    const urls = await Http<string[]>({ type: 'uploadArticle', data })
    const url = Array.isArray(urls) ? urls[0] : ''
    if (!url) {
      ElMessage.error('封面图上传失败')
      return
    }
    form.cover = url
    ElMessage.success('封面已上传')
  } catch {
    // 错误已由 Http 弹出提示
  } finally {
    coverUploading.value = false
  }
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
      form.cover = item.cover ?? ''
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
            cover: form.cover,
          },
        })
        ElMessage.success('修改成功')
        // 编辑页通常从帖子详情进入：有历史时回退到原详情，避免详情页重复入栈；
        // 直接打开编辑链接时没有历史，用详情页替换当前记录
        if (window.history.state?.back) {
          router.back()
        } else {
          router.replace({ name: 'article-detail', params: { id: articleId.value } })
        }
      } else {
        const result = await Http<{ id: string }>({
          type: 'postArticle',
          data: {
            title: form.title.trim(),
            content: encodeURIComponent(form.content),
            column: form.column,
            cover: form.cover || undefined,
          },
        })
        ElMessage.success('发布成功')
        // 替换发布页的历史记录，避免返回时回到编辑器
        router.replace({ name: 'article-detail', params: { id: result.id } })
      }
    } catch {
      // 错误已由 Http 弹出提示
    } finally {
      submitting.value = false
    }
  })
}

onMounted(async () => {
  void loadArticle()
  await loadColumns()
  // 从专栏页进入时带 column 参数，仅本人专栏可选
  const preset = String(route.query.column ?? '')
  if (!isEdit.value && preset && myColumns.value.some((col) => col._id === preset)) {
    form.column = preset
  }
})
// 同一组件在 /articles/:id/edit 之间切换时重新取数
watch(articleId, () => void loadArticle())
</script>

<template>
  <div class="create">
    <h2 class="heading">{{ isEdit ? '编辑帖子' : '发布帖子' }}</h2>

    <el-skeleton v-if="loading" :rows="4" animated />

    <el-result v-else-if="editNotFound" icon="warning" title="帖子不存在或加载失败" />
    <el-result v-else-if="editDenied" icon="error" title="无权编辑该帖子" />

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
          <el-input v-model="form.title" placeholder="请输入帖子标题" />
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
        <el-form-item label="封面图（可选）">
          <div class="cover-field">
            <div v-if="form.cover" class="cover-preview">
              <img :src="form.cover" alt="封面预览" />
              <div class="cover-actions">
                <el-upload
                  :accept="IMAGE_ACCEPT"
                  :show-file-list="false"
                  :before-upload="beforeCover"
                  :http-request="uploadCover"
                  :disabled="coverUploading"
                >
                  <el-button class="action" :loading="coverUploading">更换封面</el-button>
                </el-upload>
                <el-button class="action" @click="form.cover = ''">移除</el-button>
              </div>
            </div>
            <el-upload
              v-else
              :accept="IMAGE_ACCEPT"
              :show-file-list="false"
              :before-upload="beforeCover"
              :http-request="uploadCover"
              :disabled="coverUploading"
            >
              <button type="button" class="cover-upload" :disabled="coverUploading">
                <el-icon :size="22"><Plus /></el-icon>
                <span>{{ coverUploading ? '上传中…' : '上传封面图' }}</span>
                <span class="cover-hint">
                  支持 jpg/png/gif/webp，不超过 {{ IMAGE_MAX_SIZE_LABEL }}
                </span>
              </button>
            </el-upload>
          </div>
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
.create {
  width: 100%;
  max-width: 960px;
  padding: 0 16px 48px;
}

.heading {
  margin: 0 0 20px;
}

.column-select {
  width: 100%;
}

.cover-field {
  width: 100%;
}

.cover-preview {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
}

.cover-preview img {
  width: 240px;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color);
  object-fit: cover;
}

.cover-actions {
  display: flex;
  gap: 8px;
}

.cover-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 240px;
  aspect-ratio: 16 / 9;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
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

.cover-upload:hover {
  border-color: var(--el-color-primary);
  background: var(--app-gold-soft);
  color: var(--el-color-primary-light-3);
}

.cover-hint {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.action,
.submit {
  min-height: 44px;
}

@media (max-width: 600px) {
  .cover-preview img,
  .cover-upload {
    width: 100%;
  }
}
</style>
