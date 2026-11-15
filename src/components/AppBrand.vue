<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <RouterLink to="/" class="brand" aria-label="返回首页">Bug论坛</RouterLink>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}
</style>
