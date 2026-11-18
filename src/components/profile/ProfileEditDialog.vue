<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, UploadRequestOptions } from 'element-plus'
import { ElMessage } from 'element-plus'
import Http from '../../api'
import FORM_CONFIG from '../../config/form.config'
import {
  IMAGE_ACCEPT,
  IMAGE_MAX_SIZE,
  IMAGE_MAX_SIZE_LABEL,
  IMAGE_TYPES,
} from '../../config/upload.config'
import VALIDATE_CONFIG from '../../config/validate.config'
import type { UserProfile } from '../../types/api'
import { refreshProfile } from '../../utils/session'

const props = defineProps<{ profile: UserProfile }>()
const open = defineModel<boolean>({ required: true })

// 签名不在 PUT /user 的可修改字段中（后端白名单：password、email、nikname、avatar），故只编辑昵称与邮箱
const fields = FORM_CONFIG.userInfo.filter((f) => f.query === 'nikname' || f.query === 'email')
const formRef = ref<FormInstance>()
const submitting = ref(false)
const uploading = ref(false)
const form = reactive({ nikname: '', email: '' })
const avatarText = computed(() => props.profile.nikname?.charAt(0) ?? '')

watch(open, (value) => {
  if (value) {
    form.nikname = props.profile.nikname
    form.email = props.profile.email
  }
})

// 与后端 /upload/user 的限制一致：仅图片类型，单文件不超过 2 MB
function beforeAvatar(file: File): boolean {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    ElMessage.error('头像仅支持 jpg、png、gif、webp 格式')
    return false
  }
  if (file.size > IMAGE_MAX_SIZE) {
    ElMessage.error(`头像大小不能超过 ${IMAGE_MAX_SIZE_LABEL}`)
    return false
  }
  return true
}

// 先上传图片换取地址，再写入资料；uid 必须为本人 id，服务端会校验
async function uploadAvatar(options: UploadRequestOptions) {
  uploading.value = true
  try {
    const data = new FormData()
    data.append('file', options.file)
    data.append('uid', props.profile._id)
    const { fileURL } = await Http<{ fileURL: string }>({ type: 'uploadUserAvatar', data })
    await Http({ type: 'putUserInfo', data: { avatar: fileURL } })
    await refreshProfile().catch(() => undefined)
    ElMessage.success('头像已更新')
  } catch {
    // 错误已由 Http 弹出提示
  } finally {
    uploading.value = false
  }
}

function submit() {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await Http({ type: 'putUserInfo', data: { nikname: form.nikname, email: form.email } })
      await refreshProfile().catch(() => undefined)
      ElMessage.success('资料已更新')
      open.value = false
    } catch {
      // 错误已由 Http 弹出提示
    } finally {
      submitting.value = false
    }
  })
}
</script>

<template>
  <el-dialog v-model="open" title="编辑资料" width="400px">
    <div class="avatar-field">
      <el-avatar :size="72" :src="props.profile.avatar" class="avatar">{{ avatarText }}</el-avatar>
      <div class="avatar-actions">
        <el-upload
          :accept="IMAGE_ACCEPT"
          :show-file-list="false"
          :before-upload="beforeAvatar"
          :http-request="uploadAvatar"
          :disabled="uploading"
        >
          <el-button class="action" :loading="uploading">更换头像</el-button>
        </el-upload>
        <p class="avatar-hint">支持 jpg/png/gif/webp，不超过 {{ IMAGE_MAX_SIZE_LABEL }}</p>
      </div>
    </div>
    <el-form
      ref="formRef"
      :model="form"
      :rules="VALIDATE_CONFIG"
      label-position="top"
      @submit.prevent="submit"
    >
      <el-form-item
        v-for="field in fields"
        :key="field.query"
        :label="field.label"
        :prop="field.query"
      >
        <el-input
          v-model="form[field.query as 'nikname' | 'email']"
          :placeholder="field.placeholder"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button class="action" @click="open = false">取消</el-button>
      <el-button type="primary" class="action" :loading="submitting" @click="submit"
        >保存</el-button
      >
    </template>
  </el-dialog>
</template>

<style scoped>
.avatar-field {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.avatar {
  flex-shrink: 0;
  background: var(--app-gold-soft);
  color: var(--el-color-primary-light-3);
  font-size: 24px;
}

.avatar-actions {
  min-width: 0;
}

.avatar-hint {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.action {
  min-height: 44px;
}
</style>
