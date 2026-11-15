<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { refreshProfile } from '../utils/session'
import { confirmLogout } from '../utils/logout'
import { useUserStore } from '../stores/user'

const router = useRouter()
const user = useUserStore()

async function handleLogout() {
  if (await confirmLogout()) {
    router.push({ name: 'home' })
  }
}
const loading = ref(false)
const profile = computed(() => user.profile)
const avatarText = computed(() => profile.value?.nikname?.charAt(0) ?? '')

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
        <el-button class="logout" @click="handleLogout">退出登录</el-button>
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

.logout {
  margin-left: auto;
  min-height: 44px;
}

.username {
  color: var(--el-text-color-secondary);
  font-size: 14px;
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
</style>
