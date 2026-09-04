<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  isAnswerCorrect,
  questionOptions,
  usePaperStore,
  type PaperQuestion,
} from '@/stores/paper'
import { useNotebookStore } from '@/stores/notebook'
import { useTodoStore } from '@/stores/todo'
import { useHistoryStore } from '@/stores/history'

const route = useRoute()
const router = useRouter()
const paperStore = usePaperStore()
const notebookStore = useNotebookStore()
const todoStore = useTodoStore()
const historyStore = useHistoryStore()

const paper = computed(() => paperStore.findPaper(String(route.params.id ?? '')))
const questions = computed(() => paper.value?.questions ?? [])
const totalScore = computed(() => (paper.value ? paperStore.scoreOf(paper.value) : 0))

/* ==================== 作答状态 ==================== */
const idx = ref(0)
const answers = ref<Record<string, string>>({})
const submitted = ref(false)
const currentQ = computed(() => questions.value[idx.value])
const answeredCount = computed(() => Object.keys(answers.value).length)
const currentOptions = computed(() => (currentQ.value ? questionOptions(currentQ.value) : []))

/* ==================== 倒计时 ==================== */
const remainSec = ref(0)
let timer: ReturnType<typeof setInterval> | null = null
const remainText = computed(() => {
  const m = Math.floor(remainSec.value / 60)
  const s = remainSec.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})
const lowTime = computed(() => remainSec.value <= 60)
function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
function startTimer() {
  stopTimer()
  remainSec.value = (paper.value?.duration ?? 0) * 60
  timer = setInterval(() => {
    remainSec.value -= 1
    if (remainSec.value <= 0) {
      remainSec.value = 0
      stopTimer()
      doSubmit(true)
    }
  }, 1000)
}

onMounted(() => {
  if (paper.value) startTimer()
})
onBeforeUnmount(stopTimer)

/* ==================== 选项交互 ==================== */
function chosen(key: string) {
  const q = currentQ.value
  if (!q) return false
  if (q.type === '多选题') return (answers.value[q.id] ?? '').split('').includes(key)
  return answers.value[q.id] === key
}
function pick(key: string) {
  const q = currentQ.value
  if (!q) return
  if (q.type !== '多选题') {
    answers.value[q.id] = key
    return
  }
  const set = new Set((answers.value[q.id] ?? '').split(''))
  if (set.has(key)) set.delete(key)
  else set.add(key)
  // 按选项展示顺序排好，判分时再做排序比较
  answers.value[q.id] = currentOptions.value
    .map((o) => o.key)
    .filter((k) => set.has(k))
    .join('')
}
function onEssayInput(e: Event) {
  const q = currentQ.value
  if (!q) return
  answers.value[q.id] = (e.target as HTMLTextAreaElement).value
}
function goPrev() {
  if (idx.value > 0) idx.value -= 1
}
function goNext() {
  if (idx.value < questions.value.length - 1) idx.value += 1
}
function jumpTo(i: number) {
  idx.value = i
}

/* ==================== 退出 / 交卷 ==================== */
function requestExit() {
  if (submitted.value) {
    router.back()
    return
  }
  ElMessageBox.confirm('考试进行中，退出后本次作答不会保存。确定退出吗？', '退出考试', {
    confirmButtonText: '退出',
    cancelButtonText: '继续答题',
    type: 'warning',
  })
    .then(() => {
      stopTimer()
      router.back()
    })
    .catch(() => {})
}
function requestSubmit() {
  const missed = questions.value.length - answeredCount.value
  ElMessageBox.confirm(
    missed > 0
      ? `已答 ${answeredCount.value} 题，还有 ${missed} 题未作答。确定现在交卷吗？`
      : `已答全部 ${questions.value.length} 题，确认交卷？`,
    '交卷确认',
    { confirmButtonText: '确认交卷', cancelButtonText: '我再看看', type: 'warning' },
  )
    .then(() => doSubmit(false))
    .catch(() => {})
}

/* ==================== 判分 & 结果 ==================== */
interface ResultItem {
  q: PaperQuestion
  my: string
  myLabel: string
  ok: boolean
  gained: number
}
const result = ref<{ items: ResultItem[]; score: number; correct: number; passed: boolean | null; usedMin: number } | null>(null)

/** 把选项字母/判断词翻译成文字：A → A. xxx；AC → A. xxx、C. xxx */
function optionText(q: PaperQuestion, letters: string) {
  return letters
    .split('')
    .map((ch) => {
      const o = questionOptions(q).find((x) => x.key === ch)
      return o ? o.text : ch
    })
    .join('、')
}
function answerLabel(q: PaperQuestion, letters: string) {
  if (q.type === '判断题') return letters === '正确' || letters === '错误' ? letters : '（未作答）'
  if (!letters) return '（未作答）'
  return `${letters.split('').join('、')} · ${optionText(q, letters)}`
}
function correctLabel(q: PaperQuestion) {
  return q.type === '判断题' ? q.correct : `${q.correct.split('').join('、')} · ${optionText(q, q.correct)}`
}

function doSubmit(auto: boolean) {
  const p = paper.value
  if (!p || submitted.value) return
  stopTimer()
  const used = p.duration * 60 - remainSec.value

  const items: ResultItem[] = p.questions.map((q) => {
    const my = answers.value[q.id] ?? ''
    const ok = isAnswerCorrect(q, my)
    return { q, my, myLabel: answerLabel(q, my), ok, gained: ok ? q.score : 0 }
  })
  const correct = items.filter((it) => it.ok).length
  const score = items.reduce((s, it) => s + it.gained, 0)
  const passed = p.kind === '考试试卷' ? score >= (p.pass ?? 0) : null
  result.value = {
    items,
    score,
    correct,
    passed,
    usedMin: Math.max(1, Math.ceil(used / 60)),
  }
  submitted.value = true

  // 完成后的落库：考试写入学习历史；练习也写入学习历史；两者都从待学移除
  if (p.kind === '考试试卷') {
    historyStore.finishExam(
      {
        examName: p.name,
        score,
        pass: score >= (p.pass ?? 0),
        usedMinutes: result.value.usedMin,
        paperId: p.id,
        totalScore: totalScore.value,
        passScore: p.pass,
        questionCount: p.questions.length,
        correctCount: correct,
      },
      todoStore,
      p.id,
    )
  } else {
    // 练习卷：没有 pass 字段，直接以客观题判分结果落库，方便课后训练页统计
    historyStore.finishPractice(
      {
        paperId: p.id,
        paperName: p.name,
        course: p.course,
        score,
        totalScore: totalScore.value,
        questionCount: p.questions.length,
        correctCount: correct,
        usedMinutes: result.value.usedMin,
      },
      todoStore,
    )
  }
  ElMessage.success(auto ? '时间到，已自动交卷并判分' : '交卷成功，成绩已生成')
}

/* ==================== 错题一键同步错题集 ==================== */
const addedMap = ref<Record<string, string>>({})
const addedCount = computed(() => Object.keys(addedMap.value).length)
function toggleNotebook(q: PaperQuestion) {
  const notebookId = addedMap.value[q.id]
  if (notebookId) {
    notebookStore.removeQuestion(notebookId)
    delete addedMap.value[q.id]
    ElMessage.info('已从错题集移除')
    return
  }
  const p = paper.value
  if (!p) return
  const my = answers.value[q.id] ?? ''
  const newId = notebookStore.addQuestion({
    title: q.title,
    type: q.type,
    course: p.course || p.name,
    myAnswer: answerLabel(q, my),
    correctAnswer: correctLabel(q),
    analysis: q.analysis,
    images: [],
  })
  addedMap.value[q.id] = newId
  ElMessage.success('已同步到错题集')
}
function goDone() {
  router.push('/todo')
}
function goNotebook() {
  router.push('/training?tab=错题本')
}
</script>

<template>
  <div v-if="paper && !result" class="answer-page">
    <!-- 顶栏：退出 / 标题 / 倒计时 -->
    <header class="exam-bar">
      <button class="bar-exit" @click="requestExit">‹ 退出</button>
      <div class="bar-title">
        <strong>{{ paper.name }}</strong>
        <span>{{ paper.kind }} · 共 {{ paper.questions.length }} 题 · 满分 {{ totalScore }} 分</span>
      </div>
      <div class="bar-timer" :class="{ low: lowTime }">
        <span>剩余时间</span>
        <b>{{ remainText }}</b>
      </div>
    </header>

    <div class="answer-body">
      <!-- 当前题目 -->
      <section class="question-card" v-if="currentQ">
        <div class="q-head">
          <span class="q-no">第 {{ idx + 1 }} 题</span>
          <span class="q-type" :class="'qt-' + currentQ.type">{{ currentQ.type }}</span>
          <span class="q-score">{{ currentQ.score }} 分</span>
          <span class="q-answered" v-if="answers[currentQ.id]">✓ 已作答</span>
        </div>
        <h2 class="q-title">{{ currentQ.title }}</h2>

        <!-- 单选 / 判断 -->
        <div v-if="currentQ.type !== '多选题' && currentQ.type !== '简答题'" class="opt-list">
          <label
            v-for="opt in currentOptions"
            :key="opt.key"
            class="opt"
            :class="{ selected: chosen(opt.key) }"
          >
            <input
              type="radio"
              :name="currentQ.id"
              :value="opt.key"
              :checked="chosen(opt.key)"
              @change="pick(opt.key)"
            />
            <span class="opt-key">{{ opt.key }}</span>
            <span class="opt-text">{{ opt.text }}</span>
            <i v-if="chosen(opt.key)">✓</i>
          </label>
        </div>

        <!-- 多选 -->
        <div v-else-if="currentQ.type === '多选题'" class="opt-list">
          <label
            v-for="opt in currentOptions"
            :key="opt.key"
            class="opt"
            :class="{ selected: chosen(opt.key) }"
          >
            <input
              type="checkbox"
              :value="opt.key"
              :checked="chosen(opt.key)"
              @change="pick(opt.key)"
            />
            <span class="opt-key">{{ opt.key }}</span>
            <span class="opt-text">{{ opt.text }}</span>
            <i v-if="chosen(opt.key)">✓</i>
          </label>
          <p class="opt-hint">多选题：需选对全部正确项才得分，少选、错选不得分。</p>
        </div>

        <!-- 简答 -->
        <div v-else class="essay-box">
          <textarea
            id="essay-input"
            :placeholder="`请在下方输入你的答案（本题 ${currentQ.score} 分）`"
            rows="6"
            :value="answers[currentQ.id] ?? ''"
            @input="onEssayInput"
          ></textarea>
          <p class="opt-hint">简答题由管理员人工阅卷，交卷后请等待成绩通知。</p>
        </div>
      </section>

      <!-- 右侧答题卡 -->
      <aside class="palette">
        <h3>答题卡</h3>
        <div class="palette-nums">
          <button
            v-for="(q, i) in questions"
            :key="q.id"
            :class="{
              current: i === idx,
              done: answers[q.id],
            }"
            @click="jumpTo(i)"
          >
            {{ i + 1 }}
          </button>
        </div>
        <p class="palette-state">
          已答 <b>{{ answeredCount }}</b> / {{ questions.length }}
        </p>
        <p class="palette-legend"><i class="lg-current"></i>当前 <i class="lg-done"></i>已答 <i class="lg-empty"></i>未答</p>
        <el-button class="submit-btn" type="primary" @click="requestSubmit">交 卷</el-button>
      </aside>
    </div>

    <!-- 底部切换 -->
    <footer class="answer-foot">
      <el-button :disabled="idx === 0" @click="goPrev">‹ 上一题</el-button>
      <span class="foot-idx">{{ idx + 1 }} / {{ questions.length }}</span>
      <el-button v-if="idx < questions.length - 1" type="primary" @click="goNext">
        下一题 ›
      </el-button>
      <el-button v-else type="primary" @click="requestSubmit">交 卷</el-button>
    </footer>
  </div>

  <!-- ==================== 交卷后的结果页 ==================== -->
  <div v-else-if="paper && result" class="result-page">
    <div class="result-card" :class="result.passed === null ? 'mode-prac' : result.passed ? 'mode-pass' : 'mode-fail'">
      <div class="score-main">
        <b>{{ result.score }}</b>
        <span>得分 · 满分 {{ totalScore }}</span>
      </div>
      <div class="verdict">
        <em v-if="result.passed === true">✓ 已通过</em>
        <em v-else-if="result.passed === false">未通过 · 及格线 {{ paper.pass }} 分</em>
        <em v-else>练习完成</em>
        <p>答对 {{ result.correct }} / {{ paper.questions.length }} 题 · 用时 {{ result.usedMin }} 分钟</p>
        <p v-if="result.passed === false" class="sub">别灰心，可在次月申请一次免费补考。</p>
      </div>
    </div>

    <h3 class="result-title">答题明细</h3>
    <div class="result-list">
      <div
        v-for="(it, i) in result.items"
        :key="it.q.id"
        class="result-item"
        :class="{ wrong: !it.ok }"
      >
        <div class="ri-head">
          <span class="q-no">{{ i + 1 }}</span>
          <span class="q-type" :class="'qt-' + it.q.type">{{ it.q.type }}</span>
          <span class="ri-score">{{ it.ok ? '+' + it.q.score : '0' }} 分</span>
          <span class="ri-state" :class="it.ok ? 'right' : 'wrong'">{{ it.ok ? '✓ 答对' : '✕ 答错' }}</span>
          <!-- 答错的题可一键加入错题集 -->
          <button v-if="!it.ok" class="add-wq" :class="{ added: !!addedMap[it.q.id] }" @click="toggleNotebook(it.q)">
            {{ addedMap[it.q.id] ? '✓ 已加入错题' : '＋ 错题本' }}
          </button>
        </div>
        <h4>{{ it.q.title }}</h4>
        <div class="ri-answers">
          <p><span>我的答案</span><b :class="it.ok ? 'right' : 'wrong'">{{ it.myLabel }}</b></p>
          <p v-if="!it.ok"><span>正确答案</span><b class="right">{{ correctLabel(it.q) }}</b></p>
        </div>
        <p class="ri-analysis">解析：{{ it.q.analysis }}</p>
      </div>
    </div>

    <footer class="result-actions">
      <el-button v-if="addedCount" @click="goNotebook">查看错题集（{{ addedCount }}）</el-button>
      <el-button type="primary" size="large" @click="goDone">返回待学内容 →</el-button>
    </footer>
  </div>

  <div v-else class="missing-panel">
    <p>没有找到这份试卷。</p>
    <el-button type="primary" plain @click="router.push('/todo')">返回待学内容</el-button>
  </div>
</template>

<style scoped>
/* ============ 答题布局 ============ */
.answer-page,
.result-page {
  max-width: 980px;
  margin: 0 auto;
}
.exam-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 18px;
  margin: 0 0 22px;
  padding: 13px 22px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
}
.bar-exit {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
}
.bar-exit:hover {
  color: var(--teal);
}
.bar-title {
  flex: 1;
  min-width: 0;
}
.bar-title strong,
.bar-title span {
  display: block;
}
.bar-title strong {
  font-size: 15px;
}
.bar-title span {
  color: var(--muted);
  font-size: 11px;
  margin-top: 3px;
}
.bar-timer {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 15px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  font-size: 12px;
}
.bar-timer b {
  font-size: 17px;
  color: var(--teal);
  font-variant-numeric: tabular-nums;
}
.bar-timer.low {
  border-color: #f0c9b8;
  background: #fff5f0;
}
.bar-timer.low b {
  color: #c2410c;
}
.answer-body {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}
.question-card {
  flex: 1;
  min-width: 0;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 26px 28px;
}
.q-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.q-no {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink);
}
.q-type {
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
.qt-单选题 { background: var(--mint); color: var(--teal); }
.qt-多选题 { background: #ece9f7; color: #534ab7; }
.qt-判断题 { background: #def0e0; color: #0f6e56; }
.qt-简答题 { background: #faeeda; color: #b45309; }
.q-score {
  color: var(--muted);
  font-size: 11px;
}
.q-answered {
  margin-left: auto;
  color: var(--teal);
  font-size: 11px;
}
.q-title {
  font-size: 17px;
  line-height: 1.65;
  margin: 16px 0 20px;
}
.opt-list {
  display: flex;
  flex-direction: column;
  gap: 11px;
}
.opt {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 13px 16px;
  border: 1px solid var(--line);
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 13px;
}
.opt:hover {
  border-color: #9cc6e8;
  background: #f8fbfe;
}
.opt.selected {
  border-color: var(--teal);
  background: var(--mint);
}
.opt input {
  display: none;
}
.opt-key {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 1px solid #c5d6e2;
  border-radius: 50%;
  color: var(--muted);
  font-size: 12px;
  flex: none;
}
.opt.selected .opt-key {
  border-color: var(--teal);
  background: var(--teal);
  color: #fff;
}
.opt i {
  margin-left: auto;
  color: var(--teal);
  font-style: normal;
  font-weight: 700;
}
.opt-hint {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 11px;
}
.essay-box textarea {
  width: 100%;
  padding: 13px 15px;
  border: 1px solid var(--line);
  border-radius: 9px;
  font-size: 13px;
  line-height: 1.7;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}
.essay-box textarea:focus {
  outline: none;
  border-color: var(--teal);
}

/* 答题卡 */
.palette {
  width: 208px;
  flex: none;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 18px;
}
.palette h3 {
  margin: 0 0 13px;
  font-size: 13px;
}
.palette-nums {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.palette-nums button {
  height: 33px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: #fff;
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;
}
.palette-nums button.done {
  background: var(--mint);
  border-color: #9fd3c6;
  color: var(--teal);
}
.palette-nums button.current {
  border-color: var(--teal);
  background: var(--teal);
  color: #fff;
}
.palette-state {
  color: var(--muted);
  font-size: 12px;
  margin: 14px 0 8px;
}
.palette-state b {
  color: var(--teal);
}
.palette-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  color: var(--muted);
  font-size: 10px;
  margin: 0 0 15px;
}
.palette-legend i {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
}
.lg-current { background: var(--teal); }
.lg-done { background: var(--mint); border: 1px solid #9fd3c6; }
.lg-empty { background: #fff; border: 1px solid var(--line); }
.submit-btn {
  width: 100%;
  border: 0;
  background: var(--teal);
}
.submit-btn:hover {
  background: var(--teal);
  opacity: 0.9;
}
.answer-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin-top: 20px;
}
.foot-idx {
  color: var(--muted);
  font-size: 12px;
}

/* ============ 结果页 ============ */
.result-card {
  display: flex;
  align-items: center;
  gap: 26px;
  padding: 26px 30px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #fff;
  margin-bottom: 24px;
}
.result-card.mode-pass { border-color: #9fd3c6; background: #f2faf7; }
.result-card.mode-fail { border-color: #f0d5bd; background: #fff7f0; }
.result-card.mode-prac { border-color: #c5d8ef; background: #f6faff; }
.score-main b {
  font-size: 46px;
  line-height: 1;
}
.mode-pass .score-main b { color: var(--teal); }
.mode-fail .score-main b { color: #c2410c; }
.mode-prac .score-main b { color: var(--teal); }
.score-main span {
  display: block;
  margin-top: 7px;
  color: var(--muted);
  font-size: 12px;
}
.verdict em {
  display: block;
  font-style: normal;
  font-size: 20px;
  font-weight: 700;
}
.mode-pass .verdict em { color: var(--teal); }
.mode-fail .verdict em { color: #c2410c; }
.mode-prac .verdict em { color: var(--teal); }
.verdict p {
  margin: 7px 0 0;
  color: var(--muted);
  font-size: 12px;
}
.verdict p.sub {
  color: #b45309;
}
.result-title {
  font-size: 14px;
  margin: 0 0 13px;
}
.result-list {
  display: flex;
  flex-direction: column;
  gap: 13px;
}
.result-item {
  background: #fff;
  border: 1px solid var(--line);
  border-left: 3px solid var(--teal);
  border-radius: 10px;
  padding: 17px 20px;
}
.result-item.wrong {
  border-left-color: #e08b5a;
  background: #fffdfb;
}
.ri-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ri-score {
  color: var(--muted);
  font-size: 11px;
}
.ri-state {
  font-size: 11px;
  font-weight: 700;
}
.ri-state.right { color: var(--teal); }
.ri-state.wrong { color: #c2410c; }
.add-wq {
  margin-left: auto;
  flex: none;
  padding: 4px 12px;
  border: 1px solid #b8cfe7;
  border-radius: 999px;
  background: var(--mint);
  color: var(--teal);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}
.add-wq.added {
  border-color: var(--teal);
  background: var(--teal);
  color: #fff;
}
.result-item h4 {
  font-size: 14px;
  margin: 11px 0;
  line-height: 1.6;
}
.ri-answers {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.ri-answers p {
  margin: 0;
  padding: 7px 11px;
  background: #f7f9fa;
  border: 1px solid var(--line);
  border-radius: 7px;
  font-size: 12px;
}
.ri-answers span {
  display: block;
  color: var(--muted);
  font-size: 10px;
  margin-bottom: 3px;
}
.ri-answers b {
  font-weight: 600;
}
.ri-answers b.right { color: var(--teal); }
.ri-answers b.wrong { color: #b45309; }
.ri-analysis {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.8;
  padding-top: 9px;
  border-top: 1px dashed var(--line);
}
.result-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 22px;
}
.missing-panel {
  background: #fff;
  border: 1px dashed var(--line);
  border-radius: 10px;
  padding: 60px 20px;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
}
.missing-panel p {
  margin: 0 0 18px;
}

@media (max-width: 820px) {
  .answer-body {
    flex-direction: column;
  }
  .palette {
    width: 100%;
  }
}
</style>
