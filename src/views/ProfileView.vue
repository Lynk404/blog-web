<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { UploadRequestOptions } from 'element-plus'
import { ElMessage } from 'element-plus'
import Http from '../api'
import DeleteAccountDialog from '../components/profile/DeleteAccountDialog.vue'
import PasswordDialog from '../components/profile/PasswordDialog.vue'
import ProfileEditDialog from '../components/profile/ProfileEditDialog.vue'
import { useUserStore } from '../stores/user'
import { confirmLogout } from '../utils/logout'
import { refreshProfile } from '../utils/session'

const router = useRouter()
const user = useUserStore()
const loading = ref(false)
const profile = computed(() => user.profile)
const avatarText = computed(() => profile.value?.nikname?.charAt(0) ?? '')

const editVisible = ref(false)
const passwordVisible = ref(false)
const deleteVisible = ref(false)

// 与后端 /upload/user 的限制一致：仅图片类型，单文件不超过 100 KB
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const AVATAR_MAX_SIZE = 100 * 1024

function beforeAvatar(file: File): boolean {
  if (!AVATAR_TYPES.includes(file.type)) {
    ElMessage.error('头像仅支持 jpg、png、gif、webp 格式')
    return false
  }
  if (file.size > AVATAR_MAX_SIZE) {
    ElMessage.error('头像大小不能超过 100 KB')
    return false
  }
  return true
}

// 先上传图片换取地址，再写入资料；uid 必须为本人 id，服务端会校验
async function uploadAvatar(options: UploadRequestOptions) {
  if (!profile.value) return
  try {
    const form = new FormData()
    form.append('file', options.file)
    form.append('uid', profile.value._id)
    const { fileURL } = await Http<{ fileURL: string }>({ type: 'uploadUserAvatar', data: form })
    await Http({ type: 'putUserInfo', data: { avatar: fileURL } })
    await refreshProfile().catch(() => undefined)
    ElMessage.success('头像已更新')
  } catch {
    // 错误已由 Http 弹出提示
  }
}

async function handleLogout() {
  if (await confirmLogout()) {
    router.push({ name: 'home' })
  }
}

onMounted(async () => {
  if (profile.value) return
  loading.value = true
  try {
    await refreshProfile()
  } catch {
    // 401 已由拦截器处理；其他错误保留空状态
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="profile">
    <el-skeleton v-if="loading && !profile" :rows="4" animated />
    <template v-else-if="profile">
      <div class="header">
        <el-avatar :size="72" :src="profile.avatar">{{ avatarText }}</el-avatar>
        <div>
          <h2 class="nickname">{{ profile.nikname }}</h2>
          <div class="username">@{{ profile.username }}</div>
        </div>
        <el-button class="logout action" @click="handleLogout">退出登录</el-button>
      </div>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="邮箱">{{ profile.email }}</el-descriptions-item>
        <el-descriptions-item label="签名">{{ profile.signature || '未设置' }}</el-descriptions-item>
      </el-descriptions>

      <div class="stats">
        <el-card shadow="never" class="stat">
          <div class="stat-value">{{ profile.articleCount }}</div>
          <div class="stat-label">文章</div>
        </el-card>
        <el-card shadow="never" class="stat">
          <div class="stat-value">{{ profile.columnCount }}</div>
          <div class="stat-label">专栏</div>
        </el-card>
      </div>

      <h3 class="section-title">账号设置</h3>
      <div class="settings">
        <el-upload
          accept="image/jpeg,image/png,image/gif,image/webp"
          :show-file-list="false"
          :before-upload="beforeAvatar"
          :http-request="uploadAvatar"
        >
          <el-button class="action">更换头像</el-button>
        </el-upload>
        <el-button class="action" @click="editVisible = true">编辑资料</el-button>
        <el-button class="action" @click="passwordVisible = true">修改密码</el-button>
        <el-button class="action" type="danger" plain @click="deleteVisible = true">注销账号</el-button>
      </div>

      <ProfileEditDialog v-model="editVisible" :profile="profile" />
      <PasswordDialog v-model="passwordVisible" />
      <DeleteAccountDialog v-model="deleteVisible" />
    </template>
    <el-empty v-else description="无法加载个人信息" />
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.nickname {
  margin: 0;
}

.username {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.action {
  min-height: 44px;
}

.logout {
  margin-left: auto;
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 24px;
}

.stat {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
}

.stat-label {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.section-title {
  margin: 32px 0 12px;
}

.settings {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
