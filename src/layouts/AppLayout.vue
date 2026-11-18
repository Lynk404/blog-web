<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppBrand from '../components/AppBrand.vue'
import MessageBell from '../components/MessageBell.vue'
import { useUserStore } from '../stores/user'
import { confirmLogout } from '../utils/logout'

const router = useRouter()
const route = useRoute()
const user = useUserStore()

const isWide = computed(() => route.meta.wide === true)
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
      <div class="header-inner">
        <AppBrand />
        <div class="header-spacer"></div>
        <button
          type="button"
          class="search-trigger"
          aria-label="搜索"
          @click="router.push({ name: 'search' })"
        >
          <span class="search-label">搜索标题或正文</span>
          <span class="search-label-short" aria-hidden="true">搜索</span>
        </button>

        <MessageBell v-if="user.isLoggedIn" />

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
            <el-button text class="auth-btn" @click="router.push({ name: 'login' })"
              >登录</el-button
            >
            <el-button type="primary" class="auth-btn" @click="router.push({ name: 'register' })">
              注册
            </el-button>
          </template>
        </div>
      </div>
    </el-header>

    <el-main class="app-main" :class="{ 'is-wide': isWide }">
      <!-- key 取 Layout 直属页面记录：`/` 与 `/search` 都是 home，HomeView 不重挂载 -->
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.matched[1]?.path ?? route.path" />
        </Transition>
      </RouterView>
    </el-main>
  </el-container>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 30;
  height: 72px;
  padding: 0;
  border-bottom: 1px solid var(--el-border-color);
  background: var(--app-header-bg);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
}

/* 底边：模糊光晕 + 缓慢横向扫光，呼应 Logo 的流光 */
.app-header::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--app-header-shine) 35%,
    var(--app-header-gold) 50%,
    var(--app-header-shine) 65%,
    transparent 100%
  );
  background-size: 45% 100%;
  background-repeat: no-repeat;
  box-shadow: 0 4px 18px var(--app-header-glow);
  filter: blur(1px);
  pointer-events: none;
  animation: header-flow 9s linear infinite;
}

@keyframes header-flow {
  from {
    background-position: -60% 0;
  }

  to {
    background-position: 160% 0;
  }
}

.header-inner {
  display: flex;
  align-items: center;
  gap: 24px;
  width: 100%;
  height: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}

.header-spacer {
  flex: 1;
}

.search-trigger {
  width: 220px;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  background: var(--app-surface);
  color: var(--el-text-color-placeholder);
  font: inherit;
  font-size: 14px;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    color 0.2s;
}

.search-trigger:hover {
  border-color: var(--el-color-primary);
  background: var(--app-surface-hover);
  color: var(--el-text-color-regular);
}

.search-label-short {
  display: none;
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

.avatar-trigger:hover {
  box-shadow: 0 0 0 2px var(--el-color-primary);
}

.avatar-trigger:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.app-main {
  max-width: 960px;
  width: 100%;
  min-height: calc(100vh - 72px);
  margin: 0 auto;
}

.app-main.is-wide {
  max-width: 1600px;
}

@media (max-width: 600px) {
  .app-header {
    height: 64px;
  }

  .app-main {
    min-height: calc(100vh - 64px);
  }

  .header-inner {
    gap: 8px;
    padding: 0 12px;
  }

  .search-trigger {
    width: 56px;
    padding: 0;
    text-align: center;
  }

  .search-label {
    display: none;
  }

  .search-label-short {
    display: inline;
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-header::after {
    background: var(--el-border-color);
    background-size: auto;
    box-shadow: none;
    filter: none;
    animation: none;
  }
}
</style>
