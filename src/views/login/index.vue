<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
const router = useRouter()
const account = ref('Nora')
const password = ref('')
function login() {
  sessionStorage.setItem(
    'etblocks-user',
    JSON.stringify({ name: account.value || 'Nora', role: '管理员' }),
  )
  router.push('/admin/overview')
}

const changePasswordVisible = ref(false)
const changeForm = ref({ oldPwd: '', newPwd: '', confirmPwd: '' })
function openChangePassword() {
  changeForm.value = { oldPwd: '', newPwd: '', confirmPwd: '' }
  changePasswordVisible.value = true
}
function submitChangePassword() {
  const f = changeForm.value
  if (!f.oldPwd.trim()) { ElMessage.warning('请输入原密码'); return }
  if (!f.newPwd.trim()) { ElMessage.warning('请输入新密码'); return }
  if (f.newPwd !== f.confirmPwd) { ElMessage.warning('两次输入的新密码不一致'); return }
  if (f.newPwd === f.oldPwd) { ElMessage.warning('新密码不能与原密码相同'); return }
  changePasswordVisible.value = false
  ElMessage.success('密码已修改，下次登录请使用新密码')
}
</script>
<template>
  <main class="login-page">
    <section class="login-card">
      <div class="login-logo"><span>ET</span><strong>ET blocks</strong></div>
      <p class="slogan">企业培训学习平台 · 让成长有迹可循</p>
      <el-button class="wecom-button" @click="login"
        ><span class="wecom-icon">●</span> 企业微信一键登录</el-button
      >
      <div class="divider"><span>或使用账号登录</span></div>
      <el-form class="login-form" @submit.prevent="login">
        <el-input v-model="account" placeholder="手机号 / 企业邮箱" />
        <el-input v-model="password" type="password" placeholder="密码" show-password />
        <el-button class="account-button" native-type="submit">登 录</el-button>
      </el-form>
      <p class="hint">
        原型演示：任意方式点击即可登录<br />正式版将接入企业微信 OAuth，免密自动登录并识别身份（学员
        / 管理员）
      </p>
      <div class="login-links"><a @click="openChangePassword">修改密码</a></div>
    </section>
  </main>

  <el-dialog v-model="changePasswordVisible" title="修改密码" width="420px">
    <el-form label-position="top">
      <el-form-item label="原密码"><el-input v-model="changeForm.oldPwd" type="password" show-password placeholder="请输入原密码" /></el-form-item>
      <el-form-item label="新密码"><el-input v-model="changeForm.newPwd" type="password" show-password placeholder="请输入新密码" /></el-form-item>
      <el-form-item label="确认新密码"><el-input v-model="changeForm.confirmPwd" type="password" show-password placeholder="请再次输入新密码" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="changePasswordVisible = false">取消</el-button>
      <el-button type="primary" @click="submitChangePassword">确认修改</el-button>
    </template>
  </el-dialog>
</template>
<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  background: linear-gradient(122deg, #185fa5 0%, #185fa5 48%, #126e7e 100%);
}
.login-card {
  width: 474px;
  padding: 47px 43px 44px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(12, 68, 124, 0.2);
  text-align: center;
}
.login-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 13px;
}
.login-logo span {
  display: grid;
  place-items: center;
  width: 47px;
  height: 47px;
  border-radius: 11px;
  background: #185fa5;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
}
.login-logo strong {
  color: #17212b;
  font-size: 27px;
  font-weight: 700;
}
.slogan {
  margin: 11px 0 31px;
  color: #87919f;
  font-size: 14px;
}
.wecom-button {
  width: 100%;
  height: 52px;
  border: 0;
  border-radius: 9px;
  background: #00b96b;
  color: #fff;
  font-size: 16px;
}
.wecom-button:hover {
  border-color: #00b96b;
  background: #00a960;
  color: #fff;
}
.wecom-icon {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  margin-right: 7px;
  border-radius: 50%;
  background: #fff;
  color: #00b96b;
  font-size: 9px;
  vertical-align: 1px;
}
.divider {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 26px 0 24px;
  color: #adb5c0;
  font-size: 13px;
}
.divider::before,
.divider::after {
  content: '';
  height: 1px;
  flex: 1;
  background: #e0e5ea;
}
.login-form {
  display: grid;
  gap: 16px;
}
.login-form :deep(.el-input__wrapper) {
  min-height: 48px;
  padding: 1px 16px;
  border: 1px solid #e0e5ea;
  border-radius: 9px;
  box-shadow: none;
}
.login-form :deep(.el-input__inner) {
  color: #293440;
  font-size: 16px;
}
.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #185fa5;
  box-shadow: 0 0 0 1px #185fa5;
}
.account-button {
  width: 100%;
  height: 49px;
  border: 0;
  border-radius: 8px;
  background: #185fa5;
  color: #fff;
  font-size: 16px;
}
.account-button:hover {
  border-color: #185fa5;
  background: #0c447c;
  color: #fff;
}
.hint {
  margin-top: 21px;
  color: #9da8b7;
  font-size: 12px;
  line-height: 1.65;
}
.login-links {
  margin-top: 14px;
}
.login-links a {
  color: #185fa5;
  font-size: 13px;
  cursor: pointer;
}
@media (max-width: 520px) {
  .login-page {
    padding: 20px;
  }
  .login-card {
    width: 100%;
    padding: 36px 24px;
  }
  .login-logo strong {
    font-size: 24px;
  }
}
</style>
