<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <el-result icon="warning" title="404" sub-title="页面不存在">
    <template #extra>
      <RouterLink :to="{ name: 'home' }">返回首页</RouterLink>
    </template>
  </el-result>
</template>
