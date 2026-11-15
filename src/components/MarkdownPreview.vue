<script setup lang="ts">
// Markdown 只读渲染。v-md-editor 预览内置 xss 过滤，正文中的 HTML 脚本会被清除
import VMdPreview from '@kangc/v-md-editor/lib/preview'
import '@kangc/v-md-editor/lib/style/preview.css'
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js'
import '@kangc/v-md-editor/lib/theme/style/github.css'

VMdPreview.use(githubTheme)

defineProps<{ text: string }>()
</script>

<template>
  <VMdPreview :text="text" />
</template>
