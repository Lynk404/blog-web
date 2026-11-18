<script setup lang="ts">
// v-md-editor 编辑器（CodeMirror）。由使用它的页面懒加载，编辑器相关代码不进入首屏
import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/gfm/gfm'
import 'codemirror/addon/edit/closebrackets'
import 'codemirror/addon/edit/closetag'
import 'codemirror/addon/edit/matchbrackets'
import 'codemirror/addon/selection/active-line'
import VMdEditorBase from '@kangc/v-md-editor/lib/codemirror-editor'
import '@kangc/v-md-editor/lib/style/codemirror-editor.css'
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js'
import '@kangc/v-md-editor/lib/theme/style/github.css'
import hljs from 'highlight.js'

// v-md-editor 2.x 不再内置 CodeMirror，需通过组件选项 Codemirror 注入，否则编辑器内部报错
// scrollbarStyle 库默认为 overlay（需额外插件），这里改为 native
// github 主题必须注入 Hljs，否则任何代码块都会因 Hljs 为 undefined 抛异常并卡死页面
VMdEditorBase.use(githubTheme, { Hljs: hljs })
const VMdEditor = { ...VMdEditorBase, Codemirror: CodeMirror }

withDefaults(defineProps<{ height?: string }>(), { height: '480px' })
const text = defineModel<string>({ required: true })
const codemirrorConfig = { scrollbarStyle: 'native' }
</script>

<template>
  <VMdEditor v-model="text" :height="height" :codemirror-config="codemirrorConfig" />
</template>
