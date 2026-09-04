<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useTodoStore } from '@/stores/todo'
import { usePaperStore } from '@/stores/paper'
import { usePracticeStore } from '@/stores/practice'

const router = useRouter()
const todoStore = useTodoStore()
const paperStore = usePaperStore()
const practiceStore = usePracticeStore()

// 让 Vue 把 store 数据当 ref 用，computed 才会响应
const items = computed(() => todoStore.items)
const unfinishedCount = computed(() => todoStore.unfinishedCount)
const assignmentCount = computed(
  () => items.value.filter((it) => it.sourceType === 'assignment').length,
)

function openItem(item: (typeof items.value)[number]) {
  // 课程类：先进课程首页（详情页），再进播放页；标注来源是待学，方便原路返回
  if (item.sourceType === 'course') {
    router.push({ path: `/course/${item.sourceId}`, query: { from: 'todo' } })
    return
  }
  // Blocks：进入 Blocks 详情页，在详情里选择内容逐一学习
  if (item.sourceType === 'block') {
    router.push(`/block/${item.sourceId}`)
    return
  }
  // 练习 / 试卷（管理员指派）：练习直接进练习页；试卷先看说明页
  if (item.sourceType === 'assignment') {
    if (item.type === '练习') {
      if (practiceStore.findPractice(item.sourceId)) {
        router.push({ path: `/practice/${item.sourceId}`, query: { from: 'todo' } })
      } else {
        ElMessage.info(`正在打开：${item.title}`)
      }
      return
    }
    if (paperStore.findPaper(item.sourceId)) {
      router.push({ path: `/paper/${item.sourceId}`, query: { from: 'todo' } })
    } else {
      ElMessage.info(`正在打开：${item.title}`)
    }
  }
}
</script>

<template>
  <section class="page-heading">
    <div>
      <p class="eyebrow">MY QUEUE</p>
      <h1>待学内容</h1>
      <p>你的学习队列，有计划地完成每一次成长。</p>
    </div>
    <strong class="queue-number"
      >{{ unfinishedCount }} <small>项待完成</small></strong
    >
  </section>
  <div v-if="items.length === 0" class="empty-queue">
    <p>暂无待学内容</p>
    <small>去「学习列表」添加课程或 Blocks 开始学习吧。</small>
  </div>
  <template v-else>
    <div v-if="items[0] && items[0].sourceType === 'assignment'" class="notice">
      <span>♧</span>
      <div>
        <b>你有 {{ assignmentCount }} 个新的学习指派</b>
        <p>「{{ items[0].title }}」由培训管理员指派给你，请按时完成。</p>
      </div>
    </div>
    <div class="todo-list">
      <div v-for="item in items" :key="item.id" class="todo-item">
        <div class="todo-type" :style="{ background: item.coverColor + '20', color: item.coverColor }">
          {{ item.type }}
        </div>
        <div class="todo-main">
          <h2>{{ item.title }}</h2>
          <p>{{ item.meta }}</p>
          <div v-if="item.progress" class="progress">
            <i :style="{ width: item.progress + '%', background: item.coverColor }"></i>
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
.empty-queue {
  text-align: center;
  padding: 60px 20px;
  color: var(--muted);
  background: #fff;
  border: 1px dashed var(--line);
}
.empty-queue p {
  font-size: 14px;
  margin-bottom: 6px;
}
.empty-queue small {
  font-size: 12px;
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