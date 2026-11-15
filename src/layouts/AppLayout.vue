<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppBrand from '../components/AppBrand.vue'
import { useUserStore } from '../stores/user'
import { confirmLogout } from '../utils/logout'

const router = useRouter()
const route = useRoute()
const user = useUserStore()

const activeIndex = computed(() => (route.path.startsWith('/columns') ? '/columns' : '/'))
const avatarText = computed(() => user.profile?.nikname?.charAt(0) ?? '')

async function handleUserCommand(command: string) {
  if (command === 'profile') {
    router.push({ name: 'profile' })
    return
  }
  if (command === 'logout' && (await confirmLogout())) {
    router.push({ name: 'home' })
  }
}
</script>

<template>
  <el-container class="app-layout">
    <el-header class="app-header">
      <AppBrand />
      <el-menu mode="horizontal" :default-active="activeIndex" :router="true" class="nav">
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/columns">专栏</el-menu-item>
      </el-menu>

      <div class="auth">
        <el-dropdown v-if="user.isLoggedIn" trigger="click" @command="handleUserCommand">
          <button type="button" class="avatar-trigger" aria-label="用户菜单">
            <el-avatar :size="36" :src="user.profile?.avatar">{{ avatarText }}</el-avatar>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人主页</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <template v-else>
          <el-button text class="auth-btn" @click="router.push({ name: 'login' })">登录</el-button>
          <el-button type="primary" class="auth-btn" @click="router.push({ name: 'register' })">
            注册
          </el-button>
        </template>
      </div>
    </el-header>

    <el-main class="app-main">
      <RouterView />
    </el-main>
  </el-container>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 24px;
  border-bottom: 1px solid var(--el-border-color);
}

.nav {
  flex: 1;
  border-bottom: none;
}

.auth {
  display: flex;
  align-items: center;
  gap: 8px;
}

.auth-btn {
  min-height: 44px;
}

/* 头像触发器：保证 44px 最小点击区域与可见焦点 */
.avatar-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
}

.avatar-trigger:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.app-main {
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
}
</style>
