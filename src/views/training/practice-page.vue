<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  usePracticeStore,
  type PracticeQuestion,
  type PracticeQuestionType,
} from '@/stores/practice'
import { useHistoryStore } from '@/stores/history'
import { useTodoStore } from '@/stores/todo'
import { useNotificationStore } from '@/stores/notification'

const route = useRoute()
const router = useRouter()
const practiceStore = usePracticeStore()
const historyStore = useHistoryStore()
const todoStore = useTodoStore()
const notificationStore = useNotificationStore()

const practiceId = computed(() => String(route.params.id ?? ''))
const practice = computed(() => practiceStore.findPractice(practiceId.value))
const questions = computed(() => practice.value?.questions ?? [])

/** 已在测练记录里有这条 → 显示回顾页；否则显示做题页 */
const finishRecord = computed(() =>
  historyStore.practiceFinishes.find((f) => f.practiceId === practiceId.value),
)
const mode = computed<'do' | 'review'>(() => (finishRecord.value ? 'review' : 'do'))

/* ==================== 做题模式 ==================== */
const answers = ref<Record<string, string>>({})
const idx = ref(0)
const currentQ = computed(() => questions.value[idx.value])

function questionOptions(q: PracticeQuestion) {
  if (q.type === '判断题') {
    return [
      { key: '正确', text: '正确' },
      { key: '错误', text: '错误' },
    ]
  }
  return (q.options ?? []).map((text, i) => ({ key: String.fromCharCode(65 + i), text }))
}
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
  answers.value[q.id] = questionOptions(q)
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
const answeredCount = computed(() => Object.keys(answers.value).length)

async function doFinish() {
  const p = practice.value
  if (!p) return
  if (answeredCount.value < p.questions.length) {
    try {
      await ElMessageBox.confirm(
        `还有 ${p.questions.length - answeredCount.value} 题未作答，确定完成本次练习吗？`,
        '完成练习',
        { confirmButtonText: '完成练习', cancelButtonText: '我再看看', type: 'warning' },
      )
    } catch {
      return
    }
  }
  historyStore.finishPractice(
    {
      practiceId: p.id,
      practiceName: p.name,
      course: p.course,
      answers: { ...answers.value },
    },
    todoStore,
  )
  notificationStore.push({
    kind: '学习',
    title: `已完成练习：${p.name}`,
    body: '已归档到测练记录，点击本条消息可回顾作答。',
    link: `/practice/${p.id}?from=history`,
  })
  router.push(`/practice/${p.id}?from=history`)
}
function goBack() {
  if (route.query.from === 'history') {
    router.push('/training')
    return
  }
  router.back()
}

/* ==================== 回顾模式 ==================== */
function optionText(q: PracticeQuestion, letters: string) {
  return letters
    .split('')
    .map((ch) => {
      const o = questionOptions(q).find((x) => x.key === ch)
      return o ? o.text : ch
    })
    .join('、')
}
function myAnswerLabel(q: PracticeQuestion, letters: string) {
  if (q.type === '判断题') return letters === '正确' || letters === '错误' ? letters : '（未作答）'
  if (q.type === '思考题') return letters?.trim() || '（未作答）'
  if (!letters) return '（未作答）'
  return `${letters.split('').join('、')} · ${optionText(q, letters)}`
}
function refAnswerLabel(q: PracticeQuestion) {
  if (q.type === '思考题') return q.refAnswer?.trim() || '（开放题，无标准答案）'
  if (!q.refAnswer) return '（暂无参考答案）'
  if (q.type === '判断题') return q.refAnswer
  return `${q.refAnswer.split('').join('、')} · ${optionText(q, q.refAnswer)}`
}
function typeShortLabel(t: PracticeQuestionType) {
  return ({ 单选题: '单选', 多选题: '多选', 判断题: '判断', 思考题: '思考' })[t] || '题'
}
function typeClass(t: PracticeQuestionType) {
  return `pq-${t}`
}

/** 用于错题本同步（仅回顾模式下、客观题且学员答错时可用） */
function getMyAnswer(qid: string) {
  return finishRecord.value?.answers[qid] ?? ''
}
</script>

<template>
  <div v-if="practice" class="practice-page">
    <!-- 顶部简单返回条 -->
    <header class="page-bar">
      <button class="back-btn" @click="goBack">‹ 返回</button>
      <div class="bar-meta">
        <strong>{{ practice.name }}</strong>
        <small>{{ practice.source }} · 关联课程：{{ practice.course }}</small>
      </div>
      <span v-if="mode === 'review'" class="done-badge">
        ✓ 已完成 · {{ finishRecord?.finishedAt }}
      </span>
    </header>

    <!-- ==================== 做题模式 ==================== -->
    <template v-if="mode === 'do'">
      <section class="intro-card">
        <span class="kind-chip">练习</span>
        <p class="overline">THINKING & PRACTICE</p>
        <h1>{{ practice.name }}</h1>
        <p class="desc">{{ practice.description }}</p>
        <p class="meta-line">
          <span>{{ practice.source }} · 关联课程：{{ practice.course }}</span>
          <b v-if="practice.deadline" class="deadline">截止 {{ practice.deadline }}</b>
        </p>
        <ul class="rules">
          <li>本页是练习，不是考试——<b>不计时、不评分</b>，按自己节奏思考作答即可。</li>
          <li>客观题选择后即作答；思考题写下你的思路。</li>
          <li>全部题做完点「完成练习」后，可在「测练记录」回顾本次作答。</li>
        </ul>
      </section>

      <div class="practice-body">
        <section v-if="currentQ" class="question-card">
          <div class="q-head">
            <span class="q-no">第 {{ idx + 1 }} 题 / 共 {{ questions.length }} 题</span>
            <span class="q-type" :class="'qt-' + currentQ.type">{{ currentQ.type }}</span>
            <span class="q-answered" v-if="answers[currentQ.id]">✓ 已作答</span>
          </div>
          <h2 class="q-title">{{ currentQ.title }}</h2>

          <!-- 单选 / 判断 -->
          <div v-if="currentQ.type !== '多选题' && currentQ.type !== '思考题'" class="opt-list">
            <label
              v-for="opt in questionOptions(currentQ)"
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
              v-for="opt in questionOptions(currentQ)"
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
            <p class="opt-hint">多选题：可勾选多个选项。</p>
          </div>

          <!-- 思考题 -->
          <div v-else class="essay-box">
            <textarea
              :placeholder="`写下你的思考 / 应对思路（${currentQ.title.length > 20 ? '建议 50-300 字' : '建议 50-300 字'}）`"
              rows="6"
              :value="answers[currentQ.id] ?? ''"
              @input="onEssayInput"
            ></textarea>
            <p class="opt-hint">思考题无标准答案，重点是把思路写下来——回顾时能看见自己当时的判断。</p>
          </div>
        </section>

        <!-- 右侧：答题卡 -->
        <aside class="palette">
          <h3>练习题</h3>
          <div class="palette-nums">
            <button
              v-for="(q, i) in questions"
              :key="q.id"
              :class="{ current: i === idx, done: answers[q.id] }"
              @click="jumpTo(i)"
            >
              {{ i + 1 }}
            </button>
          </div>
          <p class="palette-state">
            已答 <b>{{ answeredCount }}</b> / {{ questions.length }}
          </p>
          <p class="palette-legend">
            <i class="lg-current"></i>当前
            <i class="lg-done"></i>已答
            <i class="lg-empty"></i>未答
          </p>
          <el-button class="finish-btn" type="primary" size="large" @click="doFinish">
            完成练习 →
          </el-button>
        </aside>
      </div>

      <footer class="practice-foot">
        <el-button :disabled="idx === 0" @click="goPrev">‹ 上一题</el-button>
        <span class="foot-idx">{{ idx + 1 }} / {{ questions.length }}</span>
        <el-button v-if="idx < questions.length - 1" type="primary" @click="goNext">
          下一题 ›
        </el-button>
        <el-button v-else type="primary" @click="doFinish">完成练习 →</el-button>
      </footer>
    </template>

    <!-- ==================== 回顾模式 ==================== -->
    <template v-else>
      <section class="review-intro">
        <span class="kind-chip">练习</span>
        <p class="overline">PRACTICE REVIEW</p>
        <h1>{{ practice.name }}</h1>
        <p class="desc">{{ practice.description }}</p>
      </section>

      <h3 class="review-title">作答回顾（{{ questions.length }} 题）</h3>
      <div class="review-list">
        <div v-for="(q, i) in questions" :key="q.id" class="review-item">
          <div class="review-head">
            <span class="q-no">{{ i + 1 }}</span>
            <span class="q-type-mini" :class="typeClass(q.type)">{{ typeShortLabel(q.type) }}</span>
          </div>
          <h4>{{ q.title }}</h4>

          <div class="answer-block">
            <div class="answer-row">
              <span class="answer-label">我的作答</span>
              <p class="answer-text my">{{ myAnswerLabel(q, getMyAnswer(q.id)) }}</p>
            </div>
            <div v-if="q.type !== '思考题'" class="answer-row">
              <span class="answer-label">参考答案</span>
              <p class="answer-text ref">{{ refAnswerLabel(q) }}</p>
            </div>
            <div v-if="q.analysis" class="answer-row">
              <span class="answer-label">解析 / 要点</span>
              <p class="answer-text analysis">{{ q.analysis }}</p>
            </div>
          </div>
        </div>
      </div>

      <footer class="review-foot">
        <el-button @click="goBack">‹ 返回测练记录</el-button>
      </footer>
    </template>
  </div>

  <div v-else class="missing-panel">
    <p>没有找到这份练习，可能已被移除。</p>
    <el-button type="primary" plain @click="router.push('/todo')">返回待学内容</el-button>
  </div>
</template>

<style scoped>
.practice-page {
  max-width: 980px;
  margin: 0 auto;
}

.page-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}
.back-btn {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}
.back-btn:hover {
  color: var(--teal);
}
.bar-meta {
  flex: 1;
  min-width: 0;
}
.bar-meta strong {
  display: block;
  font-size: 14px;
}
.bar-meta small {
  display: block;
  color: var(--muted);
  font-size: 11px;
  margin-top: 3px;
}
.done-badge {
  padding: 5px 12px;
  border-radius: 999px;
  background: #e7f7ec;
  color: #128a4b;
  font-size: 11px;
  flex: none;
}

/* ==================== 做题模式 ==================== */
.intro-card,
.review-intro {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 26px 30px 24px;
  margin-bottom: 18px;
}
.intro-card .overline,
.review-intro .overline {
  color: var(--teal);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  margin: 12px 0 6px;
}
.intro-card h1,
.review-intro h1 {
  font-size: 22px;
  line-height: 1.35;
}
.kind-chip {
  display: inline-block;
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: var(--mint);
  color: var(--teal);
}
.desc {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.75;
  margin: 12px 0 8px;
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
.rules {
  margin: 16px 0 0;
  padding-left: 0;
  list-style: none;
  border-top: 1px dashed var(--line);
  padding-top: 14px;
}
.rules li {
  position: relative;
  padding-left: 17px;
  color: #4a5b6b;
  font-size: 13px;
  line-height: 2;
}
.rules li::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 13px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--teal);
}

.practice-body {
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
.qt-思考题 { background: #faeeda; color: #b45309; }
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
.finish-btn {
  width: 100%;
  border: 0;
  background: var(--teal);
}
.finish-btn:hover {
  background: var(--teal);
  opacity: 0.9;
}
.practice-foot {
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

/* ==================== 回顾模式 ==================== */
.review-title {
  font-size: 14px;
  margin: 0 0 13px;
  color: var(--muted);
  font-weight: 600;
}
.review-list {
  display: flex;
  flex-direction: column;
  gap: 13px;
}
.review-item {
  background: #fff;
  border: 1px solid var(--line);
  border-left: 3px solid #b8cfe7;
  border-radius: 10px;
  padding: 17px 20px;
}
.review-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.q-type-mini {
  display: grid;
  place-items: center;
  min-width: 32px;
  height: 22px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}
.pq-单选题 { background: var(--mint); color: var(--teal); }
.pq-多选题 { background: #ece9f7; color: #534ab7; }
.pq-判断题 { background: #def0e0; color: #0f6e56; }
.pq-思考题 { background: #faeeda; color: #b45309; }
.review-item h4 {
  font-size: 14px;
  line-height: 1.6;
  margin: 11px 0;
}
.answer-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}
.answer-row {
  padding: 9px 12px;
  background: #fafcfb;
  border-radius: 6px;
}
.answer-label {
  display: block;
  font-size: 10px;
  color: var(--muted);
  margin-bottom: 4px;
  letter-spacing: 1px;
}
.answer-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
}
.answer-text.my {
  color: #1f2a36;
}
.answer-text.ref {
  color: var(--teal);
}
.answer-text.analysis {
  color: var(--muted);
}
.review-foot {
  display: flex;
  justify-content: flex-start;
  margin-top: 22px;
}

/* ==================== Missing ==================== */
.missing-panel {
  max-width: 480px;
  margin: 60px auto;
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
  .practice-body {
    flex-direction: column;
  }
  .palette {
    width: 100%;
  }
}
</style>