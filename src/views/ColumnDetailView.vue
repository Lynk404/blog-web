<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Http from '../api'
import type { Column } from '../types/api'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const notFound = ref(false)
const column = ref<Column | null>(null)

async function load() {
  loading.value = true
  notFound.value = false
  try {
    column.value = await Http<Column>({
      type: 'getColumnById',
      data: { id: String(route.params.id) },
    })
  } catch {
    column.value = null
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.id, load)
</script>

<template>
  <div class="column-detail">
    <el-button link class="back" @click="router.back()">← 返回</el-button>
    <el-skeleton v-if="loading" :rows="4" animated />
    <el-result v-else-if="notFound" icon="warning" title="专栏不存在或加载失败" />
    <template v-else-if="column">
      <h2>{{ column.name }}</h2>
      <el-empty v-if="!column.aids?.length" description="该专栏暂无文章" />
      <el-card
        v-for="item in column.aids ?? []"
        :key="item._id"
        class="item"
        shadow="hover"
        @click="router.push({ name: 'article-detail', params: { id: item._id } })"
      >
        <div class="title">{{ item.title }}</div>
        <div class="meta">
          <span v-if="item.author">{{ item.author.nikname }}</span>
          <span>阅读 {{ item.hit_num }}</span>
        </div>
      </el-card>
    </template>
  </div>
</template>

<style scoped>
.back {
  margin-bottom: 12px;
}

.item {
  margin-bottom: 12px;
  cursor: pointer;
}

.title {
  font-weight: 600;
  margin-bottom: 6px;
}

.meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
