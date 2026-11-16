<script setup lang="ts">
import { ref } from 'vue'
import { Bell } from '@element-plus/icons-vue'

interface MessageItem {
  id: string
  title: string
  summary: string
  time: string
  content: string
}

// 预留：后端消息接口尚未实现，当前使用本地占位数据，接入后替换这里的数据来源
const messages = ref<MessageItem[]>([
  {
    id: 'welcome',
    title: '欢迎来到 Yes论坛',
    summary: '账号已准备就绪，开始分享你的第一篇内容吧。',
    time: '今天',
    content:
      '欢迎来到 Yes论坛！\n\n你可以创建专栏、发布文章、参与评论和点赞。消息中心接口尚未接入，这里暂时展示占位内容。',
  },
  {
    id: 'notice',
    title: '消息中心建设中',
    summary: '后端消息接口接入后，这里会显示真实消息。',
    time: '昨天',
    content:
      '消息中心功能正在建设中。\n\n后端接口接入后，铃铛会展示未读消息、系统通知和互动提醒。当前内容为本地占位数据，仅用于验证交互。',
  },
])

const activeMessage = ref<MessageItem | null>(null)
const visible = ref(false)

function openMessage(id: string | number) {
  const message = messages.value.find((item) => item.id === String(id))
  if (!message) return
  activeMessage.value = message
  visible.value = true
}

function handleClosed() {
  activeMessage.value = null
}
</script>

<template>
  <div class="message-bell">
    <el-dropdown trigger="click" placement="bottom-end" @command="openMessage">
      <button type="button" class="bell-trigger" aria-label="消息" aria-haspopup="menu">
        <el-icon :size="20"><Bell /></el-icon>
      </button>
      <template #dropdown>
        <el-dropdown-menu class="message-menu">
          <el-dropdown-item v-if="messages.length === 0" disabled>暂无消息</el-dropdown-item>
          <el-dropdown-item v-for="message in messages" :key="message.id" :command="message.id">
            <div class="message-item">
              <div class="message-title">{{ message.title }}</div>
              <div class="message-summary">{{ message.summary }}</div>
              <div class="message-time">{{ message.time }}</div>
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-dialog
      v-model="visible"
      :title="activeMessage?.title ?? '消息'"
      width="min(640px, 92vw)"
      top="12vh"
      append-to-body
      @closed="handleClosed"
    >
      <div v-if="activeMessage" class="message-detail">
        <div class="message-detail-time">{{ activeMessage.time }}</div>
        <p class="message-detail-content">{{ activeMessage.content }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.bell-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--el-border-color);
  border-radius: 50%;
  background: var(--app-surface);
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s,
    background-color 0.2s;
}

.bell-trigger:hover {
  border-color: var(--el-color-primary);
  background: var(--app-surface-hover);
  color: var(--el-color-primary-light-3);
}

.bell-trigger:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.message-menu {
  width: 300px;
}

.message-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
  white-space: normal;
}

.message-title {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.message-summary {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.message-time {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.message-detail-time {
  margin-bottom: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.message-detail-content {
  margin: 0;
  color: var(--el-text-color-regular);
  line-height: 1.7;
  white-space: pre-wrap;
}
</style>
