<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import Http from '../../api'
import { useUserStore } from '../../stores/user'

const open = defineModel<boolean>({ required: true })
const router = useRouter()
const user = useUserStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const form = reactive({ password: '' })

const rules: FormRules = {
  password: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
}

watch(open, (value) => {
  if (value) form.password = ''
})

function submit() {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    try {
      // 注销不可恢复且会级联删除他人内容，二次确认
      await ElMessageBox.confirm(
        '注销后无法恢复。将删除你的全部专栏和帖子（包括他人在你专栏中发表的帖子），以及他人在你帖子下的评论。',
        '确认注销账号？',
        {
          confirmButtonText: '确认注销',
          cancelButtonText: '取消',
          type: 'error',
          closeOnClickModal: false,
          closeOnPressEscape: false,
        },
      )
    } catch {
      // 取消
      return
    }
    submitting.value = true
    try {
      await Http({ type: 'deleteUser', data: { password: form.password } })
      ElMessage.success('账号已注销')
      user.logout()
      open.value = false
      router.push({ name: 'home' })
    } catch {
      // 错误（如密码错误）已由 Http 弹出提示
    } finally {
      submitting.value = false
    }
  })
}
</script>

<template>
  <el-dialog v-model="open" title="注销账号" width="400px">
    <el-alert
      type="error"
      show-icon
      :closable="false"
      title="注销会删除你的全部专栏和帖子，连带删除他人在你专栏中发表的帖子与评论，且无法恢复。"
    />
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="form"
      @submit.prevent="submit"
    >
      <el-form-item label="当前密码" prop="password">
        <el-input v-model="form.password" type="password" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button class="action" @click="open = false">取消</el-button>
      <el-button type="danger" class="action" :loading="submitting" @click="submit"
        >注销账号</el-button
      >
    </template>
  </el-dialog>
</template>

<style scoped>
.form {
  margin-top: 16px;
}

.action {
  min-height: 44px;
}
</style>
