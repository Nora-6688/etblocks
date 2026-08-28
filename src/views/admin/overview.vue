<script setup lang="ts">
const stats = [
  { label: '学员总数', value: '128', change: '+12', note: '本月新增' },
  { label: '课程总数', value: '42', change: '+6', note: '本月新增' },
  { label: '已创建 Blocks', value: '8', change: '+2', note: '本月新增' },
  { label: '考试通过率', value: '76%', change: '+5%', note: '较上月' },
]
const todoItems = [
  { label: '待阅卷', count: '5', unit: '份', tone: 'amber' },
  { label: '待审核课程', count: '3', unit: '门', tone: 'blue' },
  { label: 'Blocks 推送待确认', count: '2', unit: '个', tone: 'blue' },
  { label: '新员工待分配', count: '4', unit: '人', tone: 'red' },
]
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
    <section class="panel">
      <h2>部门学习完成情况</h2>
      <div
        v-for="item in [
          { name: '业务部', value: 82 },
          { name: '客服部', value: 76 },
          { name: '商务部', value: 68 },
          { name: '产品部', value: 61 },
          { name: '职能部', value: 55 },
        ]"
        :key="item.name"
        class="bar-row"
      >
        <span>{{ item.name }}</span>
        <div><i :style="{ width: item.value + '%' }"></i></div>
        <b>{{ item.value }}%</b>
      </div>
    </section>
    <section class="panel todo-panel">
      <h2>待处理事项</h2>
      <div v-for="item in todoItems" :key="item.label" class="notice">
        <span>{{ item.label }}</span>
        <b class="todo-count" :class="item.tone">{{ item.count }} {{ item.unit }}</b>
      </div>
    </section>
  </div>
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
  min-height: 63px;
  padding: 13px 0;
  border-bottom: 1px solid #edf1f5;
  font-size: 12px;
  color: #172f4f;
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
}
</style>
