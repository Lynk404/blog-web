<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppBrand from '../components/AppBrand.vue'

const route = useRoute()
// 路由 meta.centered 为 true 时，内容在主区域内上下左右居中（登录、注册）
const centered = computed(() => route.meta.centered === true)
</script>

<template>
  <el-container class="auth-layout">
    <el-header class="auth-header">
      <AppBrand />
    </el-header>
    <el-main class="auth-main" :class="{ 'is-centered': centered }">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.matched[1]?.path ?? route.path" />
        </Transition>
      </RouterView>
    </el-main>
  </el-container>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
}

.auth-header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color);
}

.auth-main {
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 60px);
  padding-top: 48px;
}

.auth-main.is-centered {
  flex: 1;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px 16px;
}
</style>
