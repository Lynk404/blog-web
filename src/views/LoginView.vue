<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import Http from '../api'
import FORM_CONFIG from '../config/form.config'
import MODAL_CONFIG from '../config/modal.config'
import { safeRedirect } from '../utils/redirect'
import { refreshProfile } from '../utils/session'
import type { AuthResult } from '../types/api'

const route = useRoute()
const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)

const fields = FORM_CONFIG.login
const modal = MODAL_CONFIG.login
const form = reactive<Record<string, string>>(
  Object.fromEntries(fields.map((f) => [f.query, ''])),
)

// 登录只做必填校验：已有账号的密码可能不符合注册时的规则
const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

function submit() {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await Http<AuthResult>({
        type: 'login',
        data: { username: form.username, password: form.password },
      })
      // 资料拉取失败不影响登录，头像区域会保持占位
      await refreshProfile().catch(() => undefined)
      router.push(safeRedirect(route.query.redirect))
    } finally {
      submitting.value = false
    }
  })
}
</script>

<template>
  <div class="auth-page">
    <h2>{{ modal.title }}</h2>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
      <el-form-item v-for="field in fields" :key="field.query" :label="field.label" :prop="field.query">
        <el-input
          v-model="form[field.query]"
          :type="field.type === 'password' ? 'password' : 'text'"
          :show-password="field.type === 'password'"
          :placeholder="field.placeholder"
          :readonly="field.readonly"
        />
      </el-form-item>
      <div class="actions">
        <el-button type="primary" native-type="submit" :loading="submitting">
          {{ modal.btns.find((b) => b.isSubmit)?.name ?? '登录' }}
        </el-button>
        <RouterLink :to="{ name: 'register' }">没有账号？去注册</RouterLink>
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
