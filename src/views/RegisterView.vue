<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance } from 'element-plus'
import Http from '../api'
import FORM_CONFIG from '../config/form.config'
import MODAL_CONFIG from '../config/modal.config'
import VALIDATE_CONFIG from '../config/validate.config'
import type { AuthResult } from '../types/api'
import { refreshProfile } from '../utils/session'

const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)

const fields = FORM_CONFIG.register
const modal = MODAL_CONFIG.register
const form = reactive<Record<string, string>>(
  Object.fromEntries(fields.map((f) => [f.query, ''])),
)

function submit() {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      // 注册成功后服务端直接返回 token，无需再登录
      await Http<AuthResult>({
        type: 'register',
        data: { username: form.username, email: form.email, password: form.password },
      })
      await refreshProfile().catch(() => undefined)
      router.push({ name: 'home' })
    } finally {
      submitting.value = false
    }
  })
}
</script>

<template>
  <div class="auth-page">
    <h2>{{ modal.title }}</h2>
    <el-form ref="formRef" :model="form" :rules="VALIDATE_CONFIG" label-position="top" @submit.prevent="submit">
      <el-form-item v-for="field in fields" :key="field.query" :label="field.label" :prop="field.query">
        <el-input
          v-model="form[field.query]"
          :type="field.type === 'password' ? 'password' : 'text'"
          :show-password="field.type === 'password'"
          :placeholder="field.placeholder"
        />
      </el-form-item>
      <div class="actions">
        <el-button type="primary" native-type="submit" :loading="submitting">
          {{ modal.btns.find((b) => b.isSubmit)?.name ?? '注册' }}
        </el-button>
        <RouterLink :to="{ name: 'login' }">已有账号？去登录</RouterLink>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.auth-page {
  max-width: 400px;
  margin: 40px auto;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
