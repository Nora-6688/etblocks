<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
type Tab = '练习题' | '考试试卷' | '错题本'
const tab = ref<Tab>('练习题')
const exerciseDetail = ref(false)
const examDetail = ref(false)
const answer = ref('')
const submitted = ref(false)
const note = ref('')
const exercises = [
  {
    name: '企业文化入门 - 随堂练习',
    course: '企业文化入门',
    count: 10,
    status: '已完成',
    action: '查看',
  },
  {
    name: '业务流程规范 - 章节测试',
    course: '业务流程规范',
    count: 15,
    status: '进行中',
    action: '继续',
  },
  {
    name: '客户服务标准 - 模拟演练',
    course: '客户服务标准',
    count: 8,
    status: '未开始',
    action: '开始',
  },
]
const exams = [
  {
    name: '新人入职综合考核',
    source: '管理员指派',
    count: 50,
    duration: '60 分钟',
    deadline: '2026.09.15',
    status: '未开始',
  },
  {
    name: '业务知识季度考核',
    source: 'Blocks 内测练',
    count: 30,
    duration: '40 分钟',
    deadline: '2026.09.30',
    status: '未开始',
  },
  {
    name: 'Q2 服务标准复盘',
    source: '已完成',
    count: 20,
    duration: '30 分钟',
    deadline: '-',
    status: '已完成 · 92 分',
  },
]
function openExercise(action: string) {
  exerciseDetail.value = true
  submitted.value = action === '查看'
}
function submitAnswer() {
  submitted.value = true
  ElMessage.success('练习已完成，参考答案已展示')
}
function openExam(exam: { name: string; status: string }) {
  if (exam.status.includes('已完成')) ElMessage.info('阅卷结果：92 分')
  else examDetail.value = true
}
function saveNote() {
  ElMessage.success('错题笔记已保存')
}
function beginExam() {
  examDetail.value = false
  ElMessage.success('考试已开始')
}
</script>
<template>
  <section class="page-head">
    <div>
      <div class="overline">PRACTICE CENTER</div>
      <h1>课后训练</h1>
      <p>练习题、考试试卷和错题本</p>
    </div>
  </section>
  <div class="training-tabs">
    <button :class="{ active: tab === '练习题' }" @click="tab = '练习题'">
      <b>练习题</b><small>3 项</small></button
    ><button :class="{ active: tab === '考试试卷' }" @click="tab = '考试试卷'">
      <b>考试试卷</b><small>2 项待完成</small></button
    ><button :class="{ active: tab === '错题本' }" @click="tab = '错题本'">
      <b>错题本</b><small>我的记录</small>
    </button>
  </div>
  <section v-if="tab === '练习题'" class="list-panel">
    <div class="list-head">
      <h2>练习题</h2>
      <span>按关联课程整理</span>
    </div>
    <div v-for="exercise in exercises" :key="exercise.name" class="training-row">
      <div class="row-icon">练</div>
      <div class="row-main">
        <strong>{{ exercise.name }}</strong
        ><small>关联课程：{{ exercise.course }}</small>
      </div>
      <span class="count">{{ exercise.count }} 题</span
      ><span
        class="state"
        :class="exercise.status === '已完成' ? 'done' : exercise.status === '进行中' ? 'doing' : ''"
        >{{ exercise.status }}</span
      ><button @click="openExercise(exercise.action)">{{ exercise.action }} →</button>
    </div>
  </section>
  <section v-else-if="tab === '考试试卷'" class="list-panel">
    <div class="list-head">
      <h2>考试试卷</h2>
      <span>包含管理员指派和 Blocks 内测练</span>
    </div>
    <div v-for="exam in exams" :key="exam.name" class="training-row">
      <div class="row-icon exam-icon">卷</div>
      <div class="row-main">
        <strong>{{ exam.name }}</strong
        ><small
          >{{ exam.source }} · {{ exam.count }} 题 · {{ exam.duration }} · 截止
          {{ exam.deadline }}</small
        >
      </div>
      <span class="state" :class="{ done: exam.status.includes('已完成') }">{{ exam.status }}</span
      ><button @click="openExam(exam)">
        {{ exam.status.includes('已完成') ? '查看阅卷' : '开始考试' }} →
      </button>
    </div>
  </section>
  <section v-else class="notebook panel">
    <div class="list-head">
      <div>
        <h2>错题本</h2>
        <span>记录错题解析，可添加文字和图片</span>
      </div>
      <div>
        <el-button text @click="ElMessage.info('图片上传将在文件服务接入后启用')"
          >＋ 添加图片</el-button
        ><el-button @click="saveNote">保存</el-button>
      </div>
    </div>
    <el-input v-model="note" type="textarea" :rows="12" placeholder="点击这里编辑错题笔记……" />
    <div class="share">
      <el-button text @click="ElMessage.info('分享功能将在消息服务接入后启用')"
        >分享给其他人</el-button
      >
    </div>
  </section>
  <el-dialog v-model="exerciseDetail" title="业务流程规范 - 章节测试" width="520px"
    ><span class="question-type">单选题 · 第 1 / 15 题</span>
    <h2 class="question">业务审批流程中，超过 10 万的合同需要谁审批？</h2>
    <el-radio-group v-model="answer"
      ><el-radio label="A. 部门负责人" /><el-radio label="B. 分管领导" /><el-radio
        label="C. 总经理"
    /></el-radio-group>
    <div v-if="submitted" class="reference">
      <b>参考答案：B. 分管领导</b>
      <p>根据业务流程规范，超过 10 万的合同需要分管领导审批。</p>
    </div>
    <template #footer
      ><el-button @click="exerciseDetail = false">退出</el-button
      ><el-button type="primary" :disabled="!answer" @click="submitAnswer">{{
        submitted ? '完成' : '提交答案'
      }}</el-button></template
    ></el-dialog
  >
  <el-dialog v-model="examDetail" title="新人入职综合考核" width="520px"
    ><div class="exam-detail">
      <span>试卷名称</span><strong>新人入职综合考核</strong><span>考试时间</span
      ><strong>60 分钟 · 共 50 题 · 及格 60 分</strong>
    </div>
    <template #footer
      ><el-button @click="examDetail = false">取消</el-button
      ><el-button type="primary" @click="beginExam">开始考试</el-button></template
    ></el-dialog
  >
</template>
<style scoped>
.page-head {
  margin-bottom: 22px;
}
.overline {
  color: var(--teal);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
}
.page-head h1 {
  font-size: 22px;
  font-weight: 600;
  margin: 5px 0;
}
.page-head p {
  color: var(--muted);
  font-size: 12px;
}
.training-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--line);
}
.training-tabs button {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 13px 20px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}
.training-tabs button.active {
  border-bottom-color: var(--teal);
  background: var(--mint);
  color: var(--teal);
}
.training-tabs b {
  font-size: 13px;
}
.training-tabs small {
  font-size: 10px;
}
.list-panel,
.panel {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
}
.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 17px 20px;
  border-bottom: 1px solid var(--line);
}
.list-head h2 {
  font-size: 15px;
  font-weight: 600;
}
.list-head span {
  color: var(--muted);
  font-size: 11px;
}
.training-row {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 17px 20px;
  border-bottom: 1px solid #f0f2f5;
}
.training-row:last-child {
  border: 0;
}
.row-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  background: var(--mint);
  color: var(--teal);
  font-size: 13px;
  font-weight: 600;
}
.exam-icon {
  background: #faeeda;
  color: #b45309;
}
.row-main {
  flex: 1;
  min-width: 0;
}
.row-main strong,
.row-main small {
  display: block;
}
.row-main strong {
  font-size: 13px;
}
.row-main small {
  color: var(--muted);
  font-size: 11px;
  margin-top: 4px;
}
.count,
.state {
  font-size: 11px;
  color: var(--muted);
}
.state.doing {
  color: var(--orange);
}
.state.done {
  color: var(--teal);
}
.training-row button {
  border: 1px solid #b8cfe7;
  background: var(--mint);
  color: var(--teal);
  padding: 7px 11px;
  cursor: pointer;
  font-size: 11px;
}
.notebook {
  padding: 0;
  max-width: 760px;
}
.notebook .list-head {
  padding: 18px 20px;
}
.notebook .el-textarea {
  padding: 18px;
}
.share {
  padding: 0 18px 15px;
  text-align: right;
}
.question-type {
  color: var(--teal);
  font-size: 11px;
}
.question {
  font-size: 16px;
  margin: 18px 0;
}
.el-radio-group {
  display: grid;
  gap: 13px;
}
.reference {
  margin-top: 20px;
  padding: 13px;
  background: var(--mint);
  color: var(--teal);
  font-size: 12px;
}
.reference p {
  color: var(--muted);
  margin-top: 5px;
}
.exam-detail {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 15px;
  color: var(--muted);
  font-size: 12px;
}
.exam-detail strong {
  color: var(--ink);
  font-weight: 500;
}
@media (max-width: 600px) {
  .training-tabs button {
    padding: 12px 10px;
    flex: 1;
    justify-content: center;
  }
  .training-row {
    flex-wrap: wrap;
    padding: 15px;
  }
  .row-main {
    min-width: calc(100% - 55px);
  }
  .count {
    margin-left: 55px;
  }
  .training-row button {
    margin-left: auto;
  }
}
</style>
