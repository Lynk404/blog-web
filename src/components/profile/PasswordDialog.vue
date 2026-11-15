<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import Http from '../../api'
import VALIDATE_CONFIG from '../../config/validate.config'
import { useUserStore } from '../../stores/user'

const open = defineModel<boolean>({ required: true })
const router = useRouter()
const user = useUserStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const form = reactive({ oldPassword: '', password: '', confirm: '' })

const rules: FormRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  password: VALIDATE_CONFIG.password,
  confirm: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value === form.password) callback()
        else callback(new Error('两次输入的新密码不一致'))
      },
      trigger: 'blur',
    },
  ],
}

watch(open, (value) => {
  if (value) {
    form.oldPassword = ''
    form.password = ''
    form.confirm = ''
  }
})

function submit() {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await Http({
        type: 'putUserInfo',
        data: { password: form.password, oldPassword: form.oldPassword },
      })
      // 修改密码后旧 token 失效（接口文档约定），清除本地登录态并跳转登录页
      ElMessage.success('密码已修改，请重新登录')
      user.logout()
      open.value = false
      router.push({ name: 'login' })
    } catch {
      // 错误（如旧密码错误）已由 Http 弹出提示
    } finally {
      submitting.value = false
    }
  })
}
</script>

<template>
  <el-dialog v-model="open" title="修改密码" width="400px">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
      <el-form-item label="当前密码" prop="oldPassword">
        <el-input v-model="form.oldPassword" type="password" show-password />
      </el-form-item>
      <el-form-item label="新密码" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          show-password
          placeholder="8-12位，至少包含大小写字母和数字"
        />
      </el-form-item>
      <el-form-item label="确认新密码" prop="confirm">
        <el-input v-model="form.confirm" type="password" show-password />
      </el-form-item>
    </el-form>
    <p class="hint">修改成功后需要重新登录。</p>
    <template #footer>
      <el-button class="action" @click="open = false">取消</el-button>
      <el-button type="primary" class="action" :loading="submitting" @click="submit">确认修改</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.hint {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.action {
  min-height: 44px;
}
</style>
