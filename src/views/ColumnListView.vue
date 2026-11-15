<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Http from '../api'
import type { Column, Pagination } from '../types/api'

const router = useRouter()
const loading = ref(false)
const columns = ref<Column[]>([])

async function load() {
  loading.value = true
  try {
    const result = await Http<Pagination<Column>>({ type: 'columns' })
    columns.value = result.list
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="columns">
    <h2>专栏</h2>
    <el-skeleton v-if="loading" :rows="3" animated />
    <el-empty v-else-if="columns.length === 0" description="暂无专栏" />
    <el-card
      v-for="col in columns"
      :key="col._id"
      class="item"
      shadow="hover"
      @click="router.push({ name: 'column-detail', params: { id: col._id } })"
    >
      <div class="name">{{ col.name }}</div>
      <div class="meta">文章 {{ col.aids?.length ?? 0 }} 篇</div>
    </el-card>
  </div>
</template>

<style scoped>
.item {
  margin-bottom: 12px;
  cursor: pointer;
}

.name {
  font-size: 16px;
  font-weight: 600;
}

.meta {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 6px;
}
</style>
