<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Collection } from '@element-plus/icons-vue'
import Http from '../api'
import ColumnSidebar from '../components/ColumnSidebar.vue'
import PanelBox from '../components/PanelBox.vue'
import type { Column, Pagination } from '../types/api'

const router = useRouter()

const loading = ref(true)
const columns = ref<Column[]>([])

async function load() {
  loading.value = true
  try {
    const result = await Http<Pagination<Column>>({ type: 'columns' })
    columns.value = result.list
  } catch {
    // 错误已由 Http 弹出提示
  } finally {
    loading.value = false
  }
}

function openColumn(id: string) {
  router.push({ name: 'column-detail', params: { id } })
}

onMounted(load)
</script>

<template>
  <div class="columns-page">
    <ColumnSidebar show-create @created="load" />

    <main class="columns-main">
      <section class="columns-hero">
        <div class="hero-cover">
          <el-icon :size="34" aria-hidden="true"><Collection /></el-icon>
        </div>
        <div class="hero-text">
          <h1>全部专栏</h1>
          <p>共 {{ columns.length }} 个专栏</p>
        </div>
      </section>

      <PanelBox title="专栏列表" :icon="Collection" variant="hot">
        <el-skeleton v-if="loading" :rows="4" animated />
        <el-empty v-else-if="columns.length === 0" description="暂无专栏" />
        <ul v-else class="column-rows">
          <li v-for="col in columns" :key="col._id">
            <button type="button" class="column-row" @click="openColumn(col._id)">
              <span class="column-name">{{ col.name }}</span>
              <span class="column-meta">{{ col.aids?.length ?? 0 }} 篇帖子</span>
            </button>
          </li>
        </ul>
      </PanelBox>
    </main>
  </div>
</template>

<style scoped>
.columns-page {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 40px;
  align-items: start;
}

.columns-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.columns-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--app-hot-gradient);
}

.hero-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 10px;
  background: var(--el-fill-color);
  color: var(--el-color-primary-light-3);
}

.hero-text h1 {
  margin: 0;
  color: var(--app-on-purple);
  font-size: 24px;
  font-weight: 600;
}

.hero-text p {
  margin: 6px 0 0;
  color: var(--app-on-purple);
  font-size: 13px;
  opacity: 0.72;
}

.column-rows {
  margin: 0;
  padding: 0;
  list-style: none;
}

.column-rows li + li {
  border-top: 1px solid var(--el-border-color-lighter);
}

.column-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-height: 56px;
  padding: 0 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font: inherit;
  font-size: 15px;
  text-align: left;
  cursor: pointer;
}

.column-row:hover {
  background: var(--app-gold-soft);
  color: var(--el-text-color-primary);
}

.column-row:hover .column-name {
  color: var(--el-color-primary-light-3);
}

.column-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.column-meta {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

@media (max-width: 820px) {
  .columns-page {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .columns-main {
    gap: 16px;
  }
}
</style>
