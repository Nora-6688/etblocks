<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTrackingStore } from '@/stores/tracking'
import { useAdminStore } from '@/stores/admin'

const router = useRouter()
const trackingStore = useTrackingStore()
const adminStore = useAdminStore()
const selectedBlock = ref('')
const trackingVisible = ref(false)
const stats = [
  { label: '学员总数', value: '128', change: '+12', note: '本月新增' },
  { label: '课程总数', value: '42', change: '+6', note: '本月新增' },
  { label: '已创建 Blocks', value: '8', change: '+2', note: '本月新增' },
  { label: '考试通过率', value: '76%', change: '+5%', note: '较上月' },
]
const todoItems = computed(() => {
  const overdue = adminStore.overdueEvaluation.length
  return [
    {
      label: '待阅卷',
      count: String(adminStore.pendingGradingCount),
      unit: '份',
      tone: 'amber',
      note: '',
      link: '/admin/exams?tab=阅卷列表',
    },
    {
      label: '待评价',
      count: String(adminStore.pendingEvaluation.length),
      unit: '人',
      tone: overdue ? 'red' : 'blue',
      note: overdue ? `已超3天未评价 ${overdue} 人` : '',
      link: '/admin/students?eval=待评价',
    },
  ]
})
function goTodo(link: string) {
  router.push(link)
}
const weeklyTracking = computed(() => trackingStore.weeklyBlocks.map((name) => {
  const records = trackingStore.getByBlock(name)
  return { name, learners: records.length, completionRate: Math.round(records.reduce((sum, record) => sum + record.completionRate, 0) / Math.max(records.length, 1)) }
}))
const trackingDetails = computed(() => trackingStore.getByBlock(selectedBlock.value))
function openTracking(name: string) {
  selectedBlock.value = name
  trackingVisible.value = true
}
</script>
<template>
  <section class="heading">
    <div>
      <p>MANAGEMENT BOARD</p>
      <h1>管理看板</h1>
    </div>
  </section>
  <div class="stats">
    <div v-for="stat in stats" :key="stat.label">
      <small>{{ stat.label }}</small
      ><strong>{{ stat.value }}</strong
      ><span class="stat-note"
        ><b>{{ stat.change }}</b> {{ stat.note }}</span
      >
    </div>
  </div>
  <div class="columns">
    <section class="panel tracking-panel">
      <div class="panel-heading"><div><h2>本周推送 Blocks 学习跟踪</h2><span>已推送 Blocks 的学员学习进度</span></div></div>
      <button v-for="item in weeklyTracking" :key="item.name" class="tracking-row" @click="openTracking(item.name)"><div><strong>{{ item.name }}</strong><small>已指派 {{ item.learners }} 人</small></div><div class="tracking-progress"><i :style="{ width: item.completionRate + '%' }"></i></div><b>{{ item.completionRate }}%</b><span>查看详情 →</span></button>
      <div v-if="!weeklyTracking.length" class="empty-tracking">本周暂无已推送 Blocks</div>
    </section>
    <section class="panel todo-panel">
      <h2>待处理事项</h2>
      <button v-for="item in todoItems" :key="item.label" class="notice" @click="goTodo(item.link)">
        <span class="notice-label">{{ item.label }}<small v-if="item.note">{{ item.note }}</small></span>
        <b class="todo-count" :class="item.tone">{{ item.count }} {{ item.unit }}</b>
      </button>
      <div v-if="!todoItems.length" class="empty-tracking">暂无待处理事项</div>
    </section>
  </div>
  <el-dialog v-model="trackingVisible" :title="`学习跟踪 - ${selectedBlock}`" width="720px"><div v-if="trackingDetails.length" class="tracking-detail-summary">已指派 {{ trackingDetails.length }} 人</div><div v-else class="empty-tracking">暂无学习记录</div><table v-if="trackingDetails.length" class="tracking-detail-table"><thead><tr><th>学员</th><th>部门</th><th>指派时间</th><th>学习时长</th><th>完成率</th></tr></thead><tbody><tr v-for="record in trackingDetails" :key="record.id"><td>{{ record.learner }}</td><td>{{ record.department }}</td><td>{{ record.assignedAt }}</td><td>{{ record.learningHours }} 小时</td><td>{{ record.completionRate }}%</td></tr></tbody></table></el-dialog>
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
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 22px;
}
.stats div,
.panel {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
}
.stats div {
  padding: 20px;
}
.stats small,
.stats strong,
.stats span {
  display: block;
}
.stats small,
.stats span {
  color: var(--muted);
  font-size: 11px;
}
.stats .stat-note b {
  color: #f97316;
  font-size: 12px;
  font-weight: 600;
}
.stats strong {
  font-size: 28px;
  margin: 6px 0;
}
.columns {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 18px;
}
.panel {
  padding: 24px;
}
.panel h2 {
  font-size: 16px;
  margin-bottom: 23px;
}
.panel-heading { display: flex; justify-content: space-between; margin-bottom: 8px; }.panel-heading h2 { margin-bottom: 3px; }.panel-heading span { color: var(--muted); font-size: 11px; }
.tracking-row { display: grid; grid-template-columns: minmax(150px, 1.4fr) 1fr 42px 72px; align-items: center; gap: 12px; width: 100%; min-height: 62px; border: 0; border-bottom: 1px solid #edf1f5; background: transparent; color: var(--ink); text-align: left; cursor: pointer; }.tracking-row:hover { background: #fafcfe; }.tracking-row strong, .tracking-row small { display: block; }.tracking-row strong { font-size: 12px; font-weight: 600; }.tracking-row small { color: var(--muted); font-size: 10px; margin-top: 3px; }.tracking-progress { height: 6px; background: #e9eef3; }.tracking-progress i { display: block; height: 100%; background: var(--teal); }.tracking-row > b { color: var(--teal); font-size: 11px; }.tracking-row > span { color: var(--teal); font-size: 11px; }.empty-tracking { padding: 28px; color: var(--muted); text-align: center; font-size: 12px; }.tracking-detail-summary { display: inline-block; margin-bottom: 14px; padding: 6px 10px; background: var(--mint); color: var(--teal); font-size: 12px; }.tracking-detail-table { width: 100%; border-collapse: collapse; }.tracking-detail-table th, .tracking-detail-table td { padding: 12px 14px; border-bottom: 1px solid var(--line); text-align: left; font-size: 12px; }.tracking-detail-table th { color: var(--muted); background: #fafcfe; font-weight: 500; }
.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 17px 0;
  font-size: 12px;
}
.bar-row > span {
  width: 70px;
}
.bar-row div {
  height: 7px;
  flex: 1;
  background: #edf2f7;
}
.bar-row i {
  display: block;
  height: 100%;
  background: var(--teal);
}
.bar-row b {
  width: 34px;
  color: var(--teal);
  font-size: 11px;
}
.notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 63px;
  padding: 13px 0;
  border: 0;
  border-bottom: 1px solid #edf1f5;
  background: transparent;
  font-size: 12px;
  color: #172f4f;
  text-align: left;
  cursor: pointer;
}
.notice:hover {
  background: #fafcfe;
}
.notice-label small {
  display: block;
  margin-top: 3px;
  color: #a32d2d;
  font-size: 10px;
}
.todo-count {
  display: grid;
  place-items: center;
  min-width: 44px;
  height: 30px;
  padding: 0 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
}
.todo-count.amber { background: #faeeda; color: #b45309; }
.todo-count.blue { background: var(--mint); color: var(--teal); }
.todo-count.red { background: #fcebeb; color: #a32d2d; }
.todo-panel h2 {
  margin-bottom: 4px;
}
@media (max-width: 700px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .columns {
    grid-template-columns: 1fr;
  }
  .tracking-row { grid-template-columns: 1fr 52px; padding: 10px 0; }.tracking-progress, .tracking-row > span { display: none; }
}
</style>
