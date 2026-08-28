<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
const items = ref([
  {
    title: '完成课后练习：客户需求洞察',
    meta: '练习题 · 5 道题',
    due: '今天到期',
    type: '训练',
    state: '进行中',
    progress: 60,
  },
  {
    title: '商务谈判基础',
    meta: '课程 · 35 分钟',
    due: '明天到期',
    type: '课程',
    state: '未开始',
    progress: 0,
  },
  {
    title: 'Q3 新人培训 Blocks',
    meta: '管理员指派 · 6 个单元',
    due: '2026.08.28',
    type: 'Blocks',
    state: '未开始',
    progress: 0,
  },
])
function openItem(item: { title: string }) {
  ElMessage.info(`正在打开：${item.title}`)
}
</script>
<template>
  <section class="page-heading">
    <div>
      <p class="eyebrow">MY QUEUE</p>
      <h1>待学内容</h1>
      <p>你的学习队列，有计划地完成每一次成长。</p>
    </div>
    <strong class="queue-number">3 <small>项待完成</small></strong>
  </section>
  <div class="notice">
    <span>♧</span>
    <div>
      <b>你有 1 个新的学习指派</b>
      <p>「Q3 新人培训 Blocks」由培训管理员指派给你，请在本周内完成。</p>
    </div>
  </div>
  <div class="todo-list">
    <div v-for="item in items" :key="item.title" class="todo-item">
      <div class="todo-type">{{ item.type }}</div>
      <div class="todo-main">
        <h2>{{ item.title }}</h2>
        <p>{{ item.meta }}</p>
        <div v-if="item.progress" class="progress">
          <i :style="{ width: item.progress + '%' }"></i>
        </div>
      </div>
      <div class="todo-due">
        <span :class="{ urgent: item.due.includes('今天') }">{{ item.due }}</span
        ><small>{{ item.state }}</small>
      </div>
      <button @click="openItem(item)">{{ item.progress ? '继续学习' : '开始学习' }} →</button>
    </div>
  </div>
</template>
<style scoped>
.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  margin-bottom: 28px;
}
.eyebrow {
  color: var(--teal);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.6px;
  margin-bottom: 7px;
}
.page-heading h1 {
  font-family: Georgia, serif;
  font-size: 31px;
}
.page-heading p:not(.eyebrow) {
  color: var(--muted);
  font-size: 13px;
}
.queue-number {
  font-size: 28px;
  color: var(--orange);
}
.queue-number small {
  color: var(--muted);
  font-size: 11px;
  font-weight: 400;
}
.notice {
  display: flex;
  gap: 14px;
  padding: 18px 20px;
  margin-bottom: 18px;
  background: #fff5df;
  border-left: 3px solid var(--yellow);
}
.notice > span {
  font-size: 22px;
  color: #b88315;
}
.notice b {
  font-size: 13px;
}
.notice p {
  color: var(--muted);
  font-size: 12px;
  margin-top: 3px;
}
.todo-list {
  background: var(--paper);
  border: 1px solid var(--line);
}
.todo-item {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px 24px;
  border-bottom: 1px solid #edf1f0;
}
.todo-item:last-child {
  border: 0;
}
.todo-type {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  background: var(--mint);
  color: var(--teal);
  font-size: 11px;
}
.todo-main {
  flex: 1;
}
.todo-main h2 {
  font-size: 14px;
}
.todo-main p,
.todo-due small {
  color: var(--muted);
  font-size: 11px;
}
.progress {
  height: 4px;
  max-width: 300px;
  margin-top: 10px;
  background: #e6eeee;
}
.progress i {
  display: block;
  height: 100%;
  background: var(--teal);
}
.todo-due {
  text-align: right;
}
.todo-due span {
  display: block;
  color: var(--muted);
  font-size: 11px;
}
.todo-due .urgent {
  color: var(--orange);
}
.todo-item button {
  border: 0;
  background: var(--teal);
  color: white;
  padding: 9px 13px;
  font-size: 11px;
  cursor: pointer;
}
@media (max-width: 600px) {
  .todo-item {
    align-items: flex-start;
    flex-wrap: wrap;
    padding: 17px;
  }
  .todo-due {
    margin-left: 76px;
    text-align: left;
  }
  .todo-item button {
    margin-left: 76px;
  }
}
</style>
