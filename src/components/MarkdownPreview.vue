<script setup lang="ts">
// Markdown 只读渲染。v-md-editor 预览内置 xss 过滤，正文中的 HTML 脚本会被清除
import VMdPreview from '@kangc/v-md-editor/lib/preview'
import '@kangc/v-md-editor/lib/style/preview.css'
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js'
import '@kangc/v-md-editor/lib/theme/style/github.css'
import hljs from 'highlight.js'

// github 主题必须注入 Hljs，否则任何代码块都会因 Hljs 为 undefined 抛异常
VMdPreview.use(githubTheme, { Hljs: hljs })

defineProps<{ text: string }>()
</script>

<template>
  <VMdPreview :text="text" />
</template>
