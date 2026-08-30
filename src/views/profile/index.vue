<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useHistoryStore } from '@/stores/history'
import { useTodoStore } from '@/stores/todo'
import { useBlockStore } from '@/stores/blocks'

const router = useRouter()
const userStore = useUserStore()
const historyStore = useHistoryStore()
const todoStore = useTodoStore()
const blockStore = useBlockStore()

type TabKey = 'basic' | 'record' | 'path'
const tab = ref<TabKey>('basic')

const profile = computed(() => userStore.profile)
const stats = computed(() => historyStore.stats)

/** 学习路径列表：综合 blocks 数据 + todo + history 推算状态 */
const pathRows = computed(() =>
  blockStore.blocks.map((b) => {
    const status = historyStore.pathStatus(b.id, b.title, todoStore)
    return {
      id: b.id,
      title: b.title,
      role: b.role,
      level: b.level,
      summary: b.duration,
      description: b.description,
      color: b.color,
      state: status.state,
      progress: status.todoItem?.progress ?? 0,
    }
  }),
)

function enterBlock(id: string) {
  router.push(`/block/${id}`)
}

const stateMap: Record<string, string> = {
  未生成: '待生成',
  正在学习: '正在学习',
  曾经学习: '曾经学习',
  已完成: '已完成',
}
function stateLabel(s: string) {
  return stateMap[s] || s
}
</script>

<template>
  <section class="heading">
    <div>
      <p>MY ACCOUNT</p>
      <h1>个人中心</h1>
    </div>
    <div class="heading-meta">
      <span><b>{{ stats.finishedCourses }}</b> 门已学课程</span>
      <span><b>{{ stats.finishedBlocks }}</b> 个 Blocks 已完成</span>
      <span><b>{{ stats.examsDone }}</b> 次考试已出分</span>
    </div>
  </section>

  <div class="tabs">
    <button :class="{ active: tab === 'basic' }" @click="tab = 'basic'">基础信息</button>
    <button :class="{ active: tab === 'record' }" @click="tab = 'record'">学习记录</button>
    <button :class="{ active: tab === 'path' }" @click="tab = 'path'">我的学习路径</button>
  </div>

  <!-- ============ 基础信息 ============ -->
  <section v-if="tab === 'basic'" class="panel">
    <div class="profile-head">
      <div class="avatar" :style="{ background: profile.avatarColor }">{{ profile.name.slice(0, 1) }}</div>
      <div class="profile-id">
        <h2>{{ profile.name }}</h2>
        <p>{{ profile.department }} · {{ profile.role }} · 工号 {{ profile.workId }}</p>
        <div class="status">
          <span class="badge" :class="profile.accountStatus === '已开通' ? 'on' : 'off'">
            账号 {{ profile.accountStatus }}
          </span>
          <span class="muted">由管理端维护，学员端不可修改</span>
        </div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-item">
        <small>姓名</small>
        <span>{{ profile.name }}</span>
      </div>
      <div class="info-item">
        <small>企业邮箱</small>
        <span>{{ profile.email }}</span>
      </div>
      <div class="info-item">
        <small>所属部门</small>
        <span>{{ profile.department }}</span>
      </div>
      <div class="info-item">
        <small>岗位</small>
        <span>{{ profile.role }}</span>
      </div>
      <div class="info-item">
        <small>岗位层级</small>
        <span class="level-tag">{{ profile.level }}</span>
      </div>
      <div class="info-item">
        <small>入职时间</small>
        <span>{{ profile.joinDate }}</span>
      </div>
      <div class="info-item">
        <small>账号状态</small>
        <span>
          <em class="status-dot" :class="profile.accountStatus === '已开通' ? 'on' : 'off'"></em>
          {{ profile.accountStatus }}
        </span>
      </div>
      <div class="info-item">
        <small>数据来源</small>
        <span class="source">管理端 · 学员管理</span>
      </div>
    </div>
  </section>

  <!-- ============ 学习记录 ============ -->
  <section v-else-if="tab === 'record'" class="panel record-panel">
    <div class="record-block">
      <div class="block-head">
        <h3>历史课程</h3>
        <span class="count">{{ historyStore.courseFinishes.length }} 门</span>
      </div>
      <div v-if="historyStore.courseFinishes.length === 0" class="empty-mini">
        尚未完成任何课程，完成后会自动汇总在这里。
      </div>
      <div v-else class="record-list">
        <div v-for="row in historyStore.courseFinishes" :key="row.id" class="record-row">
          <div>
            <b>{{ row.courseName }}</b>
            <small>{{ row.source.startsWith('block:') ? `含在 Blocks 包中` : '个人加入' }} · 学时 {{ row.duration }}</small>
          </div>
          <span class="time">完成于 {{ row.finishedAt }}</span>
          <em class="state done">✓ 已完成</em>
        </div>
      </div>
    </div>

    <div class="record-block">
      <div class="block-head">
        <h3>历史考试</h3>
        <span class="count">
          {{ historyStore.examRecords.length }} 次
          <em v-if="stats.examsPending">· {{ stats.examsPending }} 待批阅</em>
        </span>
      </div>
      <div v-if="historyStore.examRecords.length === 0" class="empty-mini">
        还没有参加考试，试卷答题后会自动归档在这里。
      </div>
      <div v-else class="record-list">
        <div v-for="row in historyStore.examRecords" :key="row.id" class="record-row">
          <div>
            <b>{{ row.examName }}</b>
            <small>用时 {{ row.usedMinutes }} 分钟 · 提交于 {{ row.finishedAt }}</small>
          </div>
          <span class="time">{{ row.finishedAt }}</span>
          <em class="state" :class="row.score === '待批阅' ? 'pending' : row.pass ? 'done' : 'failed'">
            {{ row.score === '待批阅' ? '待批阅' : `${row.score}分` }}
          </em>
        </div>
      </div>
    </div>

    <div class="record-block">
      <div class="block-head">
        <h3>已完成的 Blocks</h3>
        <span class="count">{{ historyStore.blockFinishes.length }} 个</span>
      </div>
      <div v-if="historyStore.blockFinishes.length === 0" class="empty-mini">
        在待学内容完成整个 Blocks 后，会在这里留下一条记录。
      </div>
      <div v-else class="record-list">
        <div v-for="row in historyStore.blockFinishes" :key="row.id" class="record-row">
          <div>
            <b>{{ row.blockTitle }}</b>
            <small>已学 {{ row.covered }} / {{ row.total }} 项内容</small>
          </div>
          <span class="time">完成于 {{ row.finishedAt }}</span>
          <em class="state done">✓ 全部完成</em>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ 我的学习路径 ============ -->
  <section v-else-if="tab === 'path'" class="panel path-panel">
    <p class="panel-hint">根据岗位与层级，由系统或培训管理员生成/调整。下面展示曾经生成、正在学和已完成的路径。</p>
    <div v-if="pathRows.length === 0" class="empty">
      暂未生成任何学习路径，请联系管理员。
    </div>
    <div v-else class="path-list">
      <div v-for="row in pathRows" :key="row.id" class="path-row">
        <div class="path-color" :style="{ background: row.color }">{{ row.title.slice(0, 1) }}</div>
        <div class="path-main">
          <b>{{ row.title }}</b>
          <small>{{ row.role }} · {{ row.level }} · {{ row.summary }}</small>
          <p>{{ row.description }}</p>
          <div v-if="row.state === '正在学习' && row.progress" class="path-progress">
            <i :style="{ width: row.progress + '%', background: row.color }"></i>
            <span>{{ row.progress }}%</span>
          </div>
        </div>
        <div class="path-state">
          <em :class="row.state.replace(/ /g, '')">{{ stateLabel(row.state) }}</em>
          <button v-if="row.state === '正在学习'" @click="enterBlock(row.id)">继续学习</button>
          <button v-else-if="row.state === '曾经学习'" class="ghost" disabled>已归档</button>
          <button v-else-if="row.state === '已完成'" class="ghost" disabled>已学完</button>
          <button v-else class="ghost" disabled>待生成</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
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
.heading-meta {
  display: flex;
  gap: 22px;
  color: var(--muted);
  font-size: 12px;
}
.heading-meta b {
  color: var(--teal);
  font-weight: 700;
  margin-right: 3px;
  font-size: 16px;
}

/* ===== Tabs ===== */
.tabs {
  position: relative;
  display: flex;
  gap: 26px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 20px;
}
.tabs button {
  position: relative;
  border: 0;
  background: none;
  padding: 11px 2px;
  color: var(--muted);
  cursor: pointer;
  font-size: 13px;
}
.tabs button.active {
  color: var(--teal);
  border-bottom: 2px solid var(--teal);
}
.tabs .dot {
  display: inline-grid;
  place-items: center;
  margin-left: 6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--orange);
  color: #fff;
  font-size: 10px;
  vertical-align: 1px;
}

/* ===== Panel ===== */
.panel {
  max-width: 920px;
  padding: 28px;
  background: #fff;
  border: 1px solid var(--line);
}

/* ===== 基础信息 ===== */
.profile-head {
  display: flex;
  gap: 18px;
  align-items: center;
  margin-bottom: 26px;
}
.avatar {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  color: #fff;
  font-size: 26px;
  font-weight: 700;
}
.profile-id h2 {
  font-size: 19px;
  margin: 0;
}
.profile-id > p {
  color: var(--muted);
  font-size: 12px;
  margin: 4px 0 8px;
}
.status {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}
.badge {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
}
.badge.on { background: #e7f7ec; color: #128a4b; }
.badge.off { background: #fbe7e7; color: #b13838; }
.muted { color: var(--muted); font-size: 11px; }

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 18px 24px;
}
.info-item small {
  display: block;
  color: var(--muted);
  font-size: 11px;
  margin-bottom: 5px;
}
.info-item span {
  display: inline-block;
  font-size: 14px;
  color: #1f2a36;
}
.level-tag {
  padding: 2px 10px;
  background: #e7f3fb;
  color: var(--teal);
  border-radius: 4px;
  font-size: 12px;
}
.status-dot {
  display: inline-grid;
  place-items: center;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: 1px;
}
.status-dot.on { background: #1aa860; }
.status-dot.off { background: #c14040; }
.source { font-size: 12px; color: var(--muted); }

/* ===== 学习记录 ===== */
.record-panel { display: grid; gap: 22px; }
.record-block { border: 1px solid var(--line); border-radius: 10px; padding: 18px 20px; }
.block-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.block-head h3 { font-size: 14px; margin: 0; }
.block-head .count { color: var(--muted); font-size: 12px; }
.block-head .count em { color: var(--orange); font-style: normal; margin-left: 4px; font-size: 11px; }
.record-list { display: grid; gap: 8px; }
.record-row {
  display: grid;
  grid-template-columns: 1fr 160px 80px;
  gap: 16px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px dashed #edf1f5;
}
.record-row:last-child { border-bottom: 0; }
.record-row b { font-size: 13px; display: block; }
.record-row small { color: var(--muted); font-size: 11px; }
.record-row .time { color: var(--muted); font-size: 11px; text-align: right; }
.state {
  display: inline-grid;
  place-items: center;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-style: normal;
}
.state.done { background: #e7f7ec; color: #128a4b; }
.state.pending { background: #fff3d6; color: #b45309; }
.state.failed { background: #fbe7e7; color: #b13838; }
.empty-mini { color: var(--muted); font-size: 12px; padding: 4px 0; }

/* ===== 学习路径 ===== */
.panel-hint { color: var(--muted); font-size: 12px; margin: 0 0 16px; }
.path-list { display: grid; gap: 12px; }
.path-row {
  display: grid;
  grid-template-columns: 56px 1fr 140px;
  gap: 18px;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
}
.path-color {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 10px;
  color: #fff;
  font-weight: 700;
  font-size: 20px;
}
.path-main b { display: block; font-size: 14px; }
.path-main small { display: block; color: var(--muted); font-size: 11px; margin: 3px 0 6px; }
.path-main p { color: #52677e; font-size: 12px; margin: 0; }
.path-progress {
  position: relative;
  height: 4px;
  margin-top: 8px;
  background: #e6eeee;
  border-radius: 2px;
}
.path-progress i {
  display: block;
  height: 100%;
  border-radius: 2px;
}
.path-progress span {
  position: absolute;
  right: 0;
  top: -16px;
  font-size: 10px;
  color: var(--muted);
}
.path-state {
  text-align: center;
}
.path-state em {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-style: normal;
  margin-bottom: 8px;
}
.path-state em.正在学习 { background: #e7f3fb; color: var(--teal); }
.path-state em.曾经学习 { background: #f3eefb; color: #6b46c1; }
.path-state em.已完成 { background: #e7f7ec; color: #128a4b; }
.path-state em.未生成 { background: #efefef; color: #888; }
.path-state button {
  display: block;
  width: 100%;
  border: 0;
  border-radius: 6px;
  background: var(--teal);
  color: #fff;
  padding: 7px 0;
  font-size: 12px;
  cursor: pointer;
}
.path-state button.ghost {
  background: transparent;
  color: var(--muted);
  border: 1px dashed var(--line);
  cursor: not-allowed;
}

/* ===== 消息通知 ===== */
.message-panel { padding-top: 22px; }
.message-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  color: var(--muted);
  font-size: 12px;
}
.message-head .link {
  border: 0;
  background: transparent;
  color: var(--teal);
  font-size: 12px;
  cursor: pointer;
}
.message-list { display: grid; }
.message-row {
  display: grid;
  grid-template-columns: 56px 1fr 80px;
  gap: 14px;
  align-items: center;
  padding: 16px 4px;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
}
.message-row:last-child { border-bottom: 0; }
.message-row.unread b::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--orange);
  margin-right: 8px;
  vertical-align: 2px;
}
.kind {
  display: grid;
  place-items: center;
  width: 56px;
  height: 24px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}
.kind.指派 { background: #fff3d6; color: #b45309; }
.kind.考试 { background: #e7f3fb; color: var(--teal); }
.kind.学习 { background: #f3eefb; color: #6b46c1; }
.kind.系统 { background: #efefef; color: #888; }
.message-row b { display: block; font-size: 13px; }
.message-row p { color: var(--muted); font-size: 12px; margin: 4px 0 0; }
.message-row .time { color: var(--muted); font-size: 11px; text-align: right; }

/* ===== Empty fallback ===== */
.empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--muted);
}

/* ===== Responsive ===== */
@media (max-width: 760px) {
  .info-grid { grid-template-columns: 1fr 1fr; }
  .path-row { grid-template-columns: 48px 1fr; gap: 12px; }
  .path-color { width: 48px; height: 48px; }
  .path-state { grid-column: 1 / -1; }
  .record-row { grid-template-columns: 1fr; gap: 4px; }
  .record-row .time { text-align: left; }
  .message-row { grid-template-columns: 56px 1fr; gap: 10px; }
  .message-row .time { grid-column: 2; text-align: left; }
}
</style>
