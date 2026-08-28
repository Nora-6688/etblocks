<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const showDiagnosis = ref(false)
const diagnosis = ref({ role: '客户经理', stage: '成长期', difficulty: '' })
const scoreNoticeVisible = ref(false)
const scoreNotice = ref({
  paperName: '新人入职综合考核',
  score: 92,
  totalScore: 100,
  passScore: 60,
  submittedAt: '2026.08.27',
  items: [
    { title: '公司核心价值观包括以下哪些？', type: '多选题', correct: true, score: 10, userAnswer: 'AC', correctAnswer: 'AC' },
    { title: '超过10万的合同需要谁审批？', type: '单选题', correct: true, score: 10, userAnswer: 'B', correctAnswer: 'B' },
    { title: '请描述客户投诉的标准处理流程。', type: '问答题（人工判分）', correct: false, score: 0, userAnswer: '未作答', correctAnswer: '人工阅卷' },
  ],
})
const courses = [
  {
    title: '客户需求洞察与沟通策略',
    type: '岗位知识',
    duration: '42 分钟',
    progress: 68,
    color: '#1f5f9f',
  },
  {
    title: 'Ford 服务流程与标准',
    type: '工作流程',
    duration: '28 分钟',
    progress: 35,
    color: '#e47f45',
  },
]
function createPath() {
  showDiagnosis.value = false
  ElMessage.success('已生成个性化学习路径，共 6 个学习单元')
}
</script>

<template>
  <section class="diagnosis-hero">
    <button class="primary-action" @click="showDiagnosis = true">
      <span>✦</span> 开始问题诊断
    </button>
    <div>
      <p class="eyebrow">LEARNING DIAGNOSIS</p>
      <h1>从你的岗位出发，规划学习路径</h1>
      <p class="sub">选择岗位后，告诉我们当前的学习困难。</p>
    </div>
  </section>
  <div class="content-grid">
    <div class="panel progress-panel">
      <div class="panel-head">
        <div>
          <p class="eyebrow">MY LEARNING PATH</p>
          <h2>我的学习路径</h2>
        </div>
        <a href="/learning">查看全部 →</a>
      </div>
      <div class="path-track">
        <div class="track-line"></div>
        <div
          v-for="(item, index) in ['入职基础', '岗位进阶', '专业能力']"
          :key="item"
          class="path-step"
          :class="{ active: index === 1, done: index === 0 }"
        >
          <span>{{ index === 0 ? '✓' : index + 1 }}</span
          ><strong>{{ item }}</strong
          ><small>{{ index === 0 ? '已完成' : index === 1 ? '进行中 · 45%' : '未开始' }}</small>
        </div>
      </div>
      <div class="current-course" v-for="course in courses" :key="course.title">
        <div class="course-cover" :style="{ background: course.color }">
          {{ course.type === '岗位知识' ? 'INSIGHT' : 'SERVICE' }}
        </div>
        <div class="course-info">
          <small>{{ course.type }} · {{ course.duration }}</small>
          <h3>{{ course.title }}</h3>
          <div class="bar">
            <i :style="{ width: course.progress + '%', background: course.color }"></i>
          </div>
          <span>已学习 {{ course.progress }}%</span>
        </div>
        <button class="continue" @click="ElMessage.info('课程播放器将在下一步接入')">
          继续学习
        </button>
      </div>
    </div>
    <div class="right-column">
      <div class="panel task-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">UP NEXT</p>
            <h2>接下来要做</h2>
          </div>
          <span class="task-count">3</span>
        </div>
        <div class="task-item score-notice" @click="scoreNoticeVisible = true">
          <span class="task-mark score-mark">✓</span>
          <div><strong>{{ scoreNotice.paperName }} - 成绩已出</strong><small>{{ scoreNotice.score }} 分 · 点击查看答题详情</small></div>
          <b class="score-badge">{{ scoreNotice.score }}分</b>
        </div>
        <div class="task-item">
          <span class="task-mark orange-mark">!</span>
          <div><strong>完成课后练习</strong><small>客户需求洞察 · 5 道题</small></div>
          <b>今天</b>
        </div>
        <div class="task-item">
          <span class="task-mark teal-mark">▦</span>
          <div><strong>学习新课程</strong><small>商务谈判基础</small></div>
          <b>明天</b>
        </div>
        <div class="task-item">
          <span class="task-mark gray-mark">✓</span>
          <div><strong>查看学习报告</strong><small>上周学习数据已生成</small></div>
          <b>周一</b>
        </div>
        <a class="all-tasks" href="/todo">查看全部待学内容 →</a>
      </div>
    </div>
  </div>
  <el-dialog v-model="showDiagnosis" title="生成个性化学习路径" width="440px"
    ><p class="dialog-copy">告诉我们你的岗位和当前遇到的困难，AI 会为你推荐更合适的内容。</p>
    <el-form label-position="top"
      ><el-form-item label="你的岗位"><el-input v-model="diagnosis.role" /></el-form-item
      ><el-form-item label="岗位阶段"
        ><el-select v-model="diagnosis.stage" style="width: 100%"
          ><el-option label="新人期" value="新人期" /><el-option
            label="成长期"
            value="成长期" /><el-option label="专业期" value="专业期" /></el-select></el-form-item
      ><el-form-item label="最近遇到的困难"
        ><el-input
          v-model="diagnosis.difficulty"
          type="textarea"
          placeholder="例如：客户沟通时难以挖掘真实需求" /></el-form-item></el-form
    ><template #footer
      ><el-button @click="showDiagnosis = false">稍后再说</el-button
      ><el-button type="primary" @click="createPath">生成学习路径</el-button></template
    ></el-dialog
  >
  <el-dialog v-model="scoreNoticeVisible" title="答题详情" width="680px">
    <div class="score-summary">
      <div class="score-summary-item"><span>试卷</span><b>{{ scoreNotice.paperName }}</b></div>
      <div class="score-summary-item"><span>成绩</span><b class="score-big" :class="{ pass: scoreNotice.score >= scoreNotice.passScore }">{{ scoreNotice.score }} / {{ scoreNotice.totalScore }} 分</b></div>
      <div class="score-summary-item"><span>及格线</span><b>{{ scoreNotice.passScore }} 分</b></div>
      <div class="score-summary-item"><span>提交时间</span><b>{{ scoreNotice.submittedAt }}</b></div>
    </div>
    <div class="score-items">
      <div v-for="(item, i) in scoreNotice.items" :key="i" class="score-item" :class="{ wrong: !item.correct }">
        <div class="score-item-head"><span class="type-tag">{{ item.type }}</span><span class="score-item-title">{{ i + 1 }}. {{ item.title }}</span><span class="score-item-score">{{ item.correct ? `+${item.score}` : '0' }} 分</span></div>
        <div class="score-item-ans"><span>你的答案：</span><b :class="{ wrong: !item.correct }">{{ item.userAnswer || '未作答' }}</b></div>
        <div class="score-item-ans"><span>正确答案：</span><b class="correct-text">{{ item.correctAnswer }}</b></div>
      </div>
    </div>
    <template #footer><el-button @click="scoreNoticeVisible = false">关闭</el-button></template>
  </el-dialog>
</template>

<style scoped>
.welcome {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}
.diagnosis-hero {
  display: flex;
  justify-content: space-between;
  align-items: end;
  padding: 28px;
  margin-bottom: 12px;
  background: #e7f0fa;
  border: 1px solid #cbdced;
}
.diagnosis-hero .primary-action {
  order: -1;
  padding: 15px 25px;
  font-size: 14px;
}
.diagnosis-hero h1 {
  font-family: Georgia, serif;
  font-size: 25px;
}
.role-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 16px;
  margin-bottom: 23px;
  background: var(--paper);
  border: 1px solid var(--line);
  font-size: 12px;
}
.role-filter > span {
  color: var(--muted);
  margin-right: 5px;
}
.role-filter button {
  border: 1px solid var(--line);
  background: white;
  color: var(--muted);
  padding: 7px 13px;
  cursor: pointer;
  font-size: 11px;
}
.role-filter button.selected {
  border-color: var(--teal);
  background: var(--teal);
  color: white;
}
.eyebrow {
  color: var(--teal);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.6px;
  margin-bottom: 7px;
}
.welcome h1 {
  font-family: Georgia, serif;
  font-size: 31px;
  letter-spacing: 0;
}
.sub {
  color: var(--muted);
  margin-top: 5px;
  font-size: 13px;
}
.primary-action,
.continue {
  border: 0;
  color: #fff;
  background: var(--teal);
  padding: 12px 17px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
}
.primary-action span {
  margin-right: 8px;
  color: #b9d9f5;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 13px;
  margin-bottom: 23px;
}
.metric,
.panel {
  background: var(--paper);
  border: 1px solid var(--line);
}
.metric {
  min-height: 124px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
}
.metric-icon {
  display: grid;
  place-items: center;
  width: 43px;
  height: 43px;
  font-size: 20px;
}
.mint {
  color: var(--teal);
  background: var(--mint);
}
.peach {
  color: var(--orange);
  background: #fbe7d9;
}
.yellow {
  color: #9a7310;
  background: #fff1c7;
}
.blue {
  color: #39748b;
  background: #dceef2;
}
.metric small,
.metric strong,
.metric em {
  display: block;
}
.metric small {
  color: var(--muted);
  font-size: 11px;
}
.metric strong {
  margin: 3px 0;
  font-size: 23px;
}
.metric strong span {
  color: #91a0a1;
  font-size: 11px;
  font-weight: 400;
}
.metric em {
  color: var(--teal);
  font-style: normal;
  font-size: 10px;
}
.metric em i {
  color: #94a1a2;
  font-style: normal;
  margin-left: 4px;
}
.metric .orange {
  color: var(--orange);
}
.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.9fr);
  gap: 23px;
}
.panel {
  padding: 25px;
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.panel-head h2 {
  font-size: 18px;
  font-weight: 700;
}
.panel-head a,
.all-tasks {
  color: var(--teal);
  font-size: 11px;
}
.path-track {
  position: relative;
  display: flex;
  justify-content: space-between;
  padding: 23px 9% 30px;
}
.track-line {
  position: absolute;
  top: 38px;
  left: 14%;
  right: 14%;
  border-top: 1px dashed #adc4df;
}
.path-step {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #a0acad;
  font-size: 11px;
}
.path-step span {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid #c9d5d4;
  border-radius: 50%;
  background: #fff;
}
.path-step strong {
  color: #617173;
  font-size: 11px;
}
.path-step small {
  font-size: 10px;
}
.path-step.active span {
  border: 5px solid #a9cceb;
  background: var(--teal);
  color: white;
}
.path-step.active strong {
  color: var(--teal);
}
.path-step.done span {
  background: var(--teal);
  border-color: var(--teal);
  color: white;
}
.current-course {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 15px 0;
  border-top: 1px solid #edf1f0;
}
.course-cover {
  display: grid;
  place-items: center;
  width: 86px;
  height: 66px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
}
.course-info {
  min-width: 0;
  flex: 1;
}
.course-info small,
.course-info span {
  color: var(--muted);
  font-size: 10px;
}
.course-info h3 {
  overflow: hidden;
  margin: 3px 0 9px;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bar {
  height: 4px;
  margin-bottom: 4px;
  background: #e8eeee;
}
.bar i {
  display: block;
  height: 100%;
}
.continue {
  padding: 8px 11px;
  background: #e8f1fa;
  color: var(--teal);
  font-size: 10px;
}
.right-column {
  display: flex;
  flex-direction: column;
  gap: 23px;
}
.task-panel {
  flex: 1;
}
.task-count {
  display: grid;
  place-items: center;
  width: 23px;
  height: 23px;
  background: var(--orange);
  color: white;
  border-radius: 50%;
  font-size: 11px;
}
.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 17px 0;
  border-bottom: 1px solid #edf1f0;
}
.task-mark {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  font-size: 12px;
}
.orange-mark {
  background: #fbe4d4;
  color: var(--orange);
}
.teal-mark {
  background: var(--mint);
  color: var(--teal);
}
.gray-mark {
  background: #edf1f1;
  color: #859293;
}
.task-item div {
  flex: 1;
}
.task-item strong,
.task-item small {
  display: block;
}
.task-item strong {
  font-size: 12px;
}
.task-item small,
.task-item b {
  color: var(--muted);
  font-size: 10px;
  font-weight: 400;
}
.task-item b {
  align-self: flex-start;
}
.all-tasks {
  display: block;
  margin-top: 20px;
}
.quote {
  padding: 22px 25px;
  background: #e6f0fa;
  color: var(--teal-dark);
}
.quote span {
  font-family: Georgia, serif;
  font-size: 33px;
  line-height: 1;
}
.quote p {
  margin: -4px 0 10px;
  font-family: Georgia, serif;
  font-size: 16px;
  line-height: 1.45;
}
.quote small {
  color: #71918c;
  font-size: 10px;
}
.dialog-copy {
  color: var(--muted);
  margin-bottom: 18px;
  font-size: 13px;
}
.score-notice {
  cursor: pointer;
  border-left: 3px solid var(--teal);
  padding-left: 14px;
  transition: background .15s;
}
.score-notice:hover {
  background: var(--mint);
}
.score-mark {
  background: #e1f5ee !important;
  color: #0f6e56 !important;
}
.score-badge {
  color: #0f6e56;
  font-weight: 700;
  font-size: 13px !important;
}
.score-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fafbfc;
  margin-bottom: 16px;
}
.score-summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.score-summary-item span {
  color: var(--muted);
  font-size: 11px;
}
.score-summary-item b {
  font-size: 14px;
  color: var(--ink);
}
.score-big {
  font-size: 20px !important;
}
.score-big.pass {
  color: #0f6e56;
}
.score-items {
  max-height: 400px;
  overflow-y: auto;
}
.score-item {
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
}
.score-item.wrong {
  border-color: #f3c9c9;
  background: #fef7f7;
}
.score-item-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.score-item-title {
  flex: 1;
  font-size: 12px;
  color: #233e61;
}
.score-item-score {
  font-size: 12px;
  color: var(--teal);
  font-weight: 600;
  white-space: nowrap;
}
.score-item.wrong .score-item-score {
  color: #a32d2d;
}
.score-item-ans {
  font-size: 11px;
  color: var(--muted);
  margin: 3px 0;
}
.score-item-ans b {
  color: #233e61;
  font-weight: 500;
}
.score-item-ans b.wrong {
  color: #a32d2d;
}
.score-item-ans .correct-text {
  color: var(--teal);
}
@media (max-width: 900px) {
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .content-grid {
    grid-template-columns: 1fr;
  }
}
.metric {
  min-width: 0;
}
@media (max-width: 560px) {
  .diagnosis-hero {
    display: block;
    padding: 20px;
  }
  .diagnosis-hero h1 {
    font-size: 21px;
  }
  .diagnosis-hero .primary-action {
    margin-bottom: 18px;
  }
  .role-filter {
    flex-wrap: wrap;
  }
  .welcome {
    display: block;
  }
  .primary-action {
    width: 100%;
    margin-top: 18px;
  }
  .metric-grid {
    gap: 8px;
  }
  .metric {
    padding: 13px;
    gap: 9px;
  }
  .metric-icon {
    width: 34px;
    height: 34px;
  }
  .metric strong {
    font-size: 18px;
  }
  .panel {
    padding: 17px;
  }
  .current-course {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .course-cover {
    width: 64px;
    height: 54px;
  }
  .continue {
    margin-left: 80px;
  }
}
</style>
