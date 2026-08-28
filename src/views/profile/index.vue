<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
const tab = ref('基础信息')
const notifications = [
  { title: '新的 Blocks 学习指派', time: '今天 09:20' },
  { title: 'Q2 服务标准复盘已完成阅卷', time: '昨天 16:40' },
  { title: '本周有 2 项学习任务即将到期', time: '08.22' },
]
function save() {
  ElMessage.success('个人信息已保存')
}
</script>
<template>
  <section class="heading">
    <div>
      <p>MY ACCOUNT</p>
      <h1>个人中心</h1>
    </div>
  </section>
  <div class="tabs">
    <button
      v-for="item in ['基础信息', '学习记录', '我的学习路径', '消息通知']"
      :key="item"
      :class="{ active: tab === item }"
      @click="tab = item"
    >
      {{ item }}
    </button>
  </div>
  <section v-if="tab === '基础信息'" class="panel">
    <div class="profile-head">
      <div class="avatar">N</div>
      <div>
        <h2>Nora</h2>
        <p>业务部 · 业务岗 · 学员</p>
      </div>
    </div>
    <div class="form">
      <label>姓名<el-input model-value="Nora" /></label
      ><label>所属部门<el-input model-value="业务部" /></label
      ><label>入职时间<el-input model-value="2026.03.12" /></label
      ><label
        >岗位层级<el-select model-value="成长期"
          ><el-option label="新人期" value="新人期" /><el-option
            label="成长期"
            value="成长期" /><el-option label="专业期" value="专业期" /><el-option
            label="资深期"
            value="资深期" /></el-select
      ></label>
    </div>
    <el-button type="primary" @click="save">保存信息</el-button>
  </section>
  <section v-else-if="tab === '消息通知'" class="panel messages">
    <div v-for="message in notifications" :key="message.title">
      <b>{{ message.title }}</b
      ><small>{{ message.time }}</small>
    </div>
  </section>
  <section v-else class="panel empty">
    <h2>{{ tab }}</h2>
    <p>历史课程、考试成绩和学习路径将在完成记录后显示。</p>
  </section>
</template>
<style scoped>
.heading {
  margin-bottom: 28px;
}
.heading p {
  color: var(--teal);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.6px;
}
.heading h1 {
  font-family: Georgia, serif;
  font-size: 31px;
  margin-top: 7px;
}
.tabs {
  display: flex;
  gap: 24px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 18px;
}
.tabs button {
  border: 0;
  background: none;
  padding: 11px 2px;
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
}
.tabs button.active {
  color: var(--teal);
  border-bottom: 2px solid var(--teal);
}
.panel {
  max-width: 720px;
  padding: 26px;
  background: #fff;
  border: 1px solid var(--line);
}
.profile-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 25px;
}
.avatar {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: #dce9f5;
  color: var(--teal);
  font-size: 20px;
  font-weight: 700;
}
.profile-head h2 {
  font-size: 17px;
}
.profile-head p,
.empty p {
  color: var(--muted);
  font-size: 12px;
}
.form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 17px;
  margin-bottom: 23px;
}
.form label {
  display: grid;
  gap: 7px;
  color: var(--muted);
  font-size: 11px;
}
.messages div {
  display: flex;
  justify-content: space-between;
  padding: 17px 0;
  border-bottom: 1px solid #edf1f5;
}
.messages div:last-child {
  border: 0;
}
.messages small {
  color: var(--muted);
  font-size: 10px;
}
.empty {
  padding: 45px;
  text-align: center;
}
.empty h2 {
  font-size: 16px;
  margin-bottom: 8px;
}
@media (max-width: 560px) {
  .tabs {
    gap: 12px;
    overflow: auto;
  }
  .form {
    grid-template-columns: 1fr;
  }
}
</style>
