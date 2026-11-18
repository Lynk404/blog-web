<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ArticleCreateView from '../views/ArticleCreateView.vue'

const route = useRoute()
const router = useRouter()
const visible = ref(true)
const title = computed(() => (route.name === 'article-edit' ? '编辑帖子' : '发布帖子'))
const emit = defineEmits<{ saved: [] }>()

// 关闭蒙版时回到父路由：优先复用历史记录（保留滚动位置），直接打开时替换为父页面
function closeToParent() {
  const parent = route.matched[route.matched.length - 2]
  const parentName = parent?.name
  if (!parentName) {
    void router.replace({ name: 'home' })
    return
  }
  const parentPath = router.resolve({ name: parentName, params: route.params }).fullPath
  const back = typeof window.history.state?.back === 'string' ? window.history.state.back : ''
  if (back === parentPath) {
    router.back()
  } else {
    void router.replace({ name: parentName, params: route.params })
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="min(1040px, 94vw)"
    top="5vh"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    class="article-editor-dialog"
    @closed="closeToParent"
  >
    <ArticleCreateView embedded @saved="emit('saved')" />
  </el-dialog>
</template>
