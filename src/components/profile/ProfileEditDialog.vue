<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import Http from '../../api'
import FORM_CONFIG from '../../config/form.config'
import VALIDATE_CONFIG from '../../config/validate.config'
import type { UserProfile } from '../../types/api'
import { refreshProfile } from '../../utils/session'

const props = defineProps<{ profile: UserProfile }>()
const open = defineModel<boolean>({ required: true })

// 签名不在 PUT /user 的可修改字段中（后端白名单：password、email、nikname、avatar），故只编辑昵称与邮箱
const fields = FORM_CONFIG.userInfo.filter((f) => f.query === 'nikname' || f.query === 'email')
const formRef = ref<FormInstance>()
const submitting = ref(false)
const form = reactive({ nikname: '', email: '' })

watch(open, (value) => {
  if (value) {
    form.nikname = props.profile.nikname
    form.email = props.profile.email
  }
})

function submit() {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await Http({ type: 'putUserInfo', data: { nikname: form.nikname, email: form.email } })
      await refreshProfile().catch(() => undefined)
      ElMessage.success('资料已更新')
      open.value = false
    } catch {
      // 错误已由 Http 弹出提示
    } finally {
      submitting.value = false
    }
  })
}
</script>

<template>
  <el-dialog v-model="open" title="编辑资料" width="400px">
    <el-form ref="formRef" :model="form" :rules="VALIDATE_CONFIG" label-position="top" @submit.prevent="submit">
      <el-form-item v-for="field in fields" :key="field.query" :label="field.label" :prop="field.query">
        <el-input v-model="form[field.query as 'nikname' | 'email']" :placeholder="field.placeholder" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button class="action" @click="open = false">取消</el-button>
      <el-button type="primary" class="action" :loading="submitting" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.action {
  min-height: 44px;
}
</style>
