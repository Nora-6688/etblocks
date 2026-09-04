<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePaperStore } from '@/stores/paper'

const route = useRoute()
const router = useRouter()
const paperStore = usePaperStore()

const paperId = computed(() => String(route.params.id ?? ''))
const paper = computed(() => paperStore.findPaper(paperId.value))
const totalScore = computed(() => (paper.value ? paperStore.scoreOf(paper.value) : 0))
const compose = computed(() => (paper.value ? paperStore.compose(paper.value) : []))
/** 从待学内容进来的，返回键写清楚；手动输入地址的兜底也回待学 */
const backText = computed(() => (route.query.from === 'todo' ? '返回待学内容' : '返回'))

function goBack() {
  router.back()
}
function start() {
  if (paper.value) router.push(`/paper/${paper.value.id}/answer`)
}
</script>

<template>
  <div class="paper-page">
    <button class="back-link" @click="goBack">‹ {{ backText }}</button>

    <section v-if="paper" class="intro-card">
      <!-- 头部 -->
      <header>
        <span class="kind-chip exam">考试试卷</span>
        <p class="overline">EXAM PAPER</p>
        <h1>{{ paper.name }}</h1>
        <p class="desc">{{ paper.description }}</p>
        <p class="meta-line">
          <span>{{ paper.source }} · 关联课程：{{ paper.course }}</span>
          <b v-if="paper.deadline" class="deadline">截止 {{ paper.deadline }}</b>
        </p>
      </header>

      <!-- 四个关键数字 -->
      <div class="stat-grid">
        <div class="stat">
          <b>{{ totalScore }}</b>
          <span>总分（分）</span>
        </div>
        <div class="stat">
          <b>{{ paper.pass ? paper.pass + ' 分' : '—' }}</b>
          <span>通过分数</span>
        </div>
        <div class="stat">
          <b>{{ paper.duration }}</b>
          <span>考试时长（分钟）</span>
        </div>
        <div class="stat">
          <b>{{ paper.questions.length }}</b>
          <span>题目数量</span>
        </div>
      </div>

      <!-- 题目构成 -->
      <div class="compose" v-if="compose.length">
        <h3>试卷构成</h3>
        <div class="compose-chips">
          <span v-for="c in compose" :key="c.type" class="chip">
            <em :class="'chip-' + c.type">{{ c.type }}</em>
            {{ c.count }} 题 · 共 {{ c.points }} 分
          </span>
        </div>
      </div>

      <!-- 考试/练习说明 -->
      <div class="rules">
        <h3>考试说明</h3>
        <ul>
          <li>点击「开始考试」后开始计时，倒计时结束系统会自动交卷。</li>
          <li>答题时可自由切换题目，右上角会实时显示剩余时间。</li>
          <li>单选题、判断题选择后即作答；多选题需选对全部正确项才得分，少选、错选均不得分。</li>
          <li>交卷后客观题即时自动判分；含简答题的试卷需要等待管理员人工阅卷。</li>
        </ul>
        <p v-if="paper.pass" class="pass-note">
          得分 ≥ {{ paper.pass }} 分判定为通过；未通过可在次月申请一次免费补考。
        </p>
      </div>

      <!-- 底部操作 -->
      <footer class="intro-actions">
        <el-button @click="goBack">稍后再说</el-button>
        <el-button type="primary" size="large" class="start-btn" @click="start">
          开始考试 →
        </el-button>
      </footer>
    </section>

    <section v-else class="missing">
      <p>没有找到这份试卷，可能已被管理员撤回。</p>
      <el-button type="primary" plain @click="goBack">返回待学内容</el-button>
    </section>
  </div>
</template>

<style scoped>
.paper-page {
  max-width: 860px;
  margin: 0 auto;
}
.back-link {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
  padding: 0 0 16px;
}
.back-link:hover {
  color: var(--teal);
}
.intro-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 34px 40px 30px;
}
header .overline {
  color: var(--teal);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  margin: 14px 0 6px;
}
header h1 {
  font-size: 26px;
  line-height: 1.35;
}
.kind-chip {
  display: inline-block;
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
.kind-chip.exam {
  background: #faeeda;
  color: #b45309;
}
.kind-chip.prac {
  background: var(--mint);
  color: var(--teal);
}
.desc {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.75;
  margin: 14px 0 8px;
}
.meta-line {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  color: var(--muted);
  font-size: 12px;
}
.meta-line .deadline {
  padding: 2px 9px;
  border-radius: 999px;
  background: #fff2e8;
  color: #c2410c;
  font-weight: 500;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: 26px 0;
}
.stat {
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fafcfb;
  padding: 16px 10px;
  text-align: center;
}
.stat b {
  display: block;
  font-size: 25px;
  color: var(--ink);
}
.stat span {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 11px;
}
.compose {
  border-top: 1px dashed var(--line);
  padding: 18px 0;
}
.compose h3,
.rules h3 {
  font-size: 13px;
  margin: 0 0 12px;
  font-weight: 600;
}
.compose-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  font-size: 12px;
}
.chip em {
  font-style: normal;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
}
.chip-单选题 {
  background: var(--mint);
  color: var(--teal);
}
.chip-多选题 {
  background: #ece9f7;
  color: #534ab7;
}
.chip-判断题 {
  background: #def0e0;
  color: #0f6e56;
}
.chip-简答题 {
  background: #faeeda;
  color: #b45309;
}
.rules {
  border-top: 1px dashed var(--line);
  border-bottom: 1px dashed var(--line);
  padding: 18px 0;
}
.rules ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
}
.rules li {
  position: relative;
  padding-left: 17px;
  color: #4a5b6b;
  font-size: 13px;
  line-height: 1.9;
}
.rules li::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 12px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--teal);
}
.pass-note {
  margin: 10px 0 0;
  padding: 9px 13px;
  border-radius: 7px;
  background: #fff5df;
  color: #8a6110;
  font-size: 12px;
  line-height: 1.7;
}
.intro-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 26px;
}
.start-btn {
  min-width: 168px;
  border: 0;
  background: var(--teal);
}
.start-btn:hover {
  background: var(--teal);
  opacity: 0.9;
}
.missing {
  background: #fff;
  border: 1px dashed var(--line);
  border-radius: 10px;
  padding: 60px 20px;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
}
.missing p {
  margin: 0 0 18px;
}
@media (max-width: 640px) {
  .intro-card {
    padding: 24px 18px 22px;
  }
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
