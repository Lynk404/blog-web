<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppBrand from '../components/AppBrand.vue'
</script>

<template>
  <el-container class="auth-layout">
    <el-header class="auth-header">
      <AppBrand />
    </el-header>
    <el-main class="auth-main">
      <RouterView />
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
  padding-top: 48px;
}
</style>
