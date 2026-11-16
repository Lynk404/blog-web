<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    title: string
    icon?: Component
    variant?: 'purple' | 'hot'
  }>(),
  { variant: 'purple' },
)
</script>

<template>
  <section class="app-panel" :class="`is-${variant}`">
    <div class="app-panel-head">
      <slot name="head">
        <h2 class="app-panel-title">
          <el-icon v-if="icon" :size="18" aria-hidden="true">
            <component :is="icon" />
          </el-icon>
          <span>{{ title }}</span>
        </h2>
      </slot>
      <slot name="actions" />
    </div>
    <div class="app-panel-body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.app-panel {
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--app-surface);
}

.app-panel.is-purple .app-panel-head {
  background: var(--app-purple-gradient);
}

.app-panel.is-hot .app-panel-head {
  background: var(--app-hot-gradient);
}

.app-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 16px 18px;
}

.app-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--app-on-purple);
  font-size: 17px;
  font-weight: 600;
}

.app-panel-title .el-icon {
  color: var(--el-color-primary-light-3);
}

.app-panel-body {
  padding: 10px;
}
</style>
