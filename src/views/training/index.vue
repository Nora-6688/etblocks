<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  useNotebookStore,
  type WrongQuestion,
  type WrongQuestionType,
} from '@/stores/notebook'
import { usePaperStore } from '@/stores/paper'
import { useHistoryStore, type ExamRecord } from '@/stores/history'
import { useTodoStore } from '@/stores/todo'

type Tab = '练习题' | '考试试卷' | '错题本'
const route = useRoute()
const router = useRouter()
// 支持从消息通知带 ?tab= 直达对应标签页（例如阅卷完成 → 考试试卷）
const queryTab = route.query.tab as Tab | undefined
const tab = ref<Tab>(
  queryTab && ['练习题', '考试试卷', '错题本'].includes(queryTab) ? queryTab : '练习题',
)

const paperStore = usePaperStore()
const historyStore = useHistoryStore()
const todoStore = useTodoStore()

/** 当前还在待学里的 assignment 试卷 id（用来排除/提示，避免学员误以为已完成） */
const pendingAssignmentIds = computed(() => {
  const set = new Set<string>()
  for (const it of todoStore.items) {
    if (it.sourceType === 'assignment') set.add(it.sourceId)
  }
  return set
})

/** 练习题 tab：历史完成的练习卷（按规则，课后训练里出现的练习一定都是已完成） */
const practices = computed(() => historyStore.practiceFinishes)

/** 考试试卷 tab：历史考试记录 */
const examRecords = computed(() => historyStore.examRecords)
const examPendingCount = computed(
  () => examRecords.value.filter((e) => e.score === '待批阅').length,
)
const examPassedCount = computed(
  () => examRecords.value.filter((e) => e.score !== '待批阅' && e.pass === true).length,
)

/** 复用 paper store 的字段补充（关联课程 / 时长 / 截止） */
function paperMeta(paperId: string | undefined) {
  if (!paperId) return null
  const p = paperStore.findPaper(paperId)
  return p ? { course: p.course, duration: p.duration, deadline: p.deadline, source: p.source } : null
}

/** 行内跳转：学员在训练页里看结果时直接进入说明页（练习可回顾、考试可补考） */
function gotoPaper(exam: ExamRecord) {
  if (!exam.paperId) return
  router.push(`/paper/${exam.paperId}?from=history`)
}

/** 练习完成记录 → 伪装的 ExamRecord（仅用于跳转时类型对齐） */
function gotoPracticePaper(p: { paperId: string; paperName: string; finishedAt: string; score: number; totalScore: number; questionCount: number; correctCount: number; usedMinutes: number }) {
  if (!p.paperId) return
  router.push(`/paper/${p.paperId}?from=history`)
}

/* ==================== 阅卷结果查看弹窗 ==================== */
interface ReviewQuestion {
  id: string
  no: number
  type: WrongQuestionType
  title: string
  myAnswer: string
  correctAnswer: string
  analysis: string
  correct: boolean
}

const reviewDialog = ref(false)
const reviewExam = ref<ExamRecord | null>(null)
const reviewInfo = ref({ score: 0, wrong: 0, submittedAt: '2026.08.28 10:24' })
/** 本次阅卷里已同步到错题集的映射：阅卷题目 id → 错题集条目 id（再点一次可取消） */
const addedMap = ref<Record<string, string>>({})

/**
 * 演示题库（正式版由后端阅卷接口返回，包含学员真实作答）。
 * 阅卷结果页靠这套数据展示"我的答案 vs 正确答案 + 解析"，并支持一键入错题本。
 * 这里保留下来，因为 paper store 只存题目 + 标准答案，不存学员作答，
 * 等 Phase 4 接后端后这块改成从阅卷接口拉。
 */
const reviewQuestions: ReviewQuestion[] = [
  {
    id: 'rq1',
    no: 1,
    type: '单选题',
    title: '客户提出投诉时，第一步应该做什么？',
    myAnswer: 'B. 先解释公司政策',
    correctAnswer: 'A. 先安抚情绪、倾听并记录诉求',
    analysis: '服务标准要求"先处理心情，再处理事情"，第一步永远是安抚与倾听，直接解释政策容易激化情绪。',
    correct: false,
  },
  {
    id: 'rq2',
    no: 2,
    type: '判断题',
    title: '所有客户投诉都必须在 24 小时内完成首次响应。',
    myAnswer: '正确',
    correctAnswer: '正确',
    analysis: '按现行服务标准，投诉首次响应时限统一为 24 小时。',
    correct: true,
  },
  {
    id: 'rq3',
    no: 3,
    type: '多选题',
    title: '以下哪些属于客户服务禁语？',
    myAnswer: 'A、C',
    correctAnswer: 'A、B、C',
    analysis: 'B 项"你去问别的部门"同样属于推诿类禁语，多选题漏选不得分。',
    correct: false,
  },
  {
    id: 'rq4',
    no: 4,
    type: '简答题',
    title: '简述 VIP 客户服务升级的处理流程。',
    myAnswer: '受理后按等级转交主管处理，处理完反馈客户。',
    correctAnswer: '受理 → 分级 → 升级处理 → 结果反馈 → 回访确认',
    analysis: '整体思路对，但漏了最后的"回访确认"闭环环节，阅卷扣 2 分。',
    correct: true,
  },
]

function openReview(exam: ExamRecord) {
  // 待批阅的不能进查看阅卷，避免误点
  if (exam.score === '待批阅') {
    ElMessage.info('这份试卷还在等待管理员批阅，成绩出来后会同步过来～')
    return
  }
  reviewExam.value = exam
  reviewInfo.value = {
    score: typeof exam.score === 'number' ? exam.score : 0,
    wrong: reviewQuestions.filter((q) => !q.correct).length,
    submittedAt: exam.finishedAt,
  }
  addedMap.value = {}
  reviewDialog.value = true
}

/** 一键把这道题加入错题集；已加入时再点一次取消 */
function toggleNotebook(q: ReviewQuestion) {
  const wqId = addedMap.value[q.id]
  if (wqId) {
    notebookStore.removeQuestion(wqId)
    delete addedMap.value[q.id]
    ElMessage.info('已从错题集移除')
  } else {
    const newId = notebookStore.addQuestion({
      title: q.title,
      type: q.type,
      course: reviewExam.value?.examName ?? '未关联课程',
      myAnswer: q.myAnswer,
      correctAnswer: q.correctAnswer,
      analysis: q.analysis,
      images: [],
    })
    addedMap.value[q.id] = newId
    ElMessage.success('已同步到错题集')
  }
}

/* ==================== 错题集 ==================== */
const notebookStore = useNotebookStore()

type DialogMode = 'view' | 'edit' | 'create'
const questionDialog = ref({
  visible: false,
  mode: 'view' as DialogMode,
  /** 当前查看/编辑的错题 id；create 时为空 */
  id: '',
})

function emptyQuestion(): WrongQuestion {
  return {
    id: '',
    title: '',
    type: '单选题',
    course: '',
    myAnswer: '',
    correctAnswer: '',
    analysis: '',
    images: [],
    createdAt: '',
    updatedAt: '',
  }
}
const form = ref<WrongQuestion>(emptyQuestion())

const questionTypeOptions: WrongQuestionType[] = ['单选题', '多选题', '判断题', '简答题']
const dialogTitle = computed(
  () =>
    ({ view: '错题详情', edit: '编辑错题', create: '新增错题' })[questionDialog.value.mode],
)

/** 打开新增 */
function openCreate() {
  form.value = emptyQuestion()
  questionDialog.value = { visible: true, mode: 'create', id: '' }
}
/** 打开查看 */
function openView(q: WrongQuestion) {
  form.value = JSON.parse(JSON.stringify(q)) // 拷贝，避免没保存就污染列表
  questionDialog.value = { visible: true, mode: 'view', id: q.id }
}
/** 查看态 → 编辑态 */
function startEdit() {
  questionDialog.value.mode = 'edit'
}
function closeDialog() {
  questionDialog.value.visible = false
}

/** 保存（新增 or 编辑共用） */
function saveQuestion() {
  if (!form.value.title.trim()) {
    ElMessage.warning('题干不能为空')
    return
  }
  if (questionDialog.value.mode === 'create') {
    notebookStore.addQuestion({
      title: form.value.title.trim(),
      type: form.value.type,
      course: form.value.course.trim() || '未关联课程',
      myAnswer: form.value.myAnswer.trim(),
      correctAnswer: form.value.correctAnswer.trim(),
      analysis: form.value.analysis.trim(),
      images: form.value.images,
    })
    ElMessage.success('已收录到错题集')
  } else {
    notebookStore.updateQuestion(questionDialog.value.id, {
      title: form.value.title.trim(),
      type: form.value.type,
      course: form.value.course.trim() || '未关联课程',
      myAnswer: form.value.myAnswer.trim(),
      correctAnswer: form.value.correctAnswer.trim(),
      analysis: form.value.analysis.trim(),
      images: form.value.images,
    })
    ElMessage.success('错题已更新')
  }
  closeDialog()
}

/** 从错题集列表行内删除一条错题 */
async function confirmRemove(id: string) {
  const q = notebookStore.items.find((x) => x.id === id)
  if (!q) return
  try {
    await ElMessageBox.confirm(`确定从错题集删除这道题吗？删除后不可恢复。`, '删除错题', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  notebookStore.removeQuestion(id)
  // 如果正开着这道题的详情弹窗，一并关掉
  if (questionDialog.value.id === id) closeDialog()
  // 如果这道题是阅卷里同步的，同步取消阅卷里的"已加入"状态
  for (const [reviewId, wqId] of Object.entries(addedMap.value)) {
    if (wqId === id) delete addedMap.value[reviewId]
  }
  ElMessage.success('已从错题集删除')
}

/* 图片：读取本地文件为 dataURL 预览 */
const fileInput = ref<HTMLInputElement | null>(null)
function pickImages() {
  fileInput.value?.click()
}
function onFilesChosen(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  files.forEach((file) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      form.value.images.push({
        id: 'img' + Date.now() + Math.random().toString(36).slice(2, 6),
        name: file.name,
        url: String(reader.result),
      })
    }
    reader.readAsDataURL(file)
  })
  input.value = '' // 允许重复选同一个文件
}
function removeImage(imgId: string) {
  form.value.images = form.value.images.filter((i) => i.id !== imgId)
}
function typeClass(t: string) {
  return `wq-${t}`
}
/** 短标签（用于方块里）：单选 / 多选 / 判断 / 简答 */
function typeShortLabel(t: string) {
  return {
    单选题: '单选',
    多选题: '多选',
    判断题: '判断',
    简答题: '简答',
  }[t] || '题'
}
</script>
<template>
  <section class="page-head">
    <div>
      <div class="overline">PRACTICE CENTER</div>
      <h1>课后训练</h1>
      <p>练习题、考试试卷和错题本 · 这里看到的都是已经完成的记录</p>
    </div>
  </section>
  <div class="training-tabs">
    <button :class="{ active: tab === '练习题' }" @click="tab = '练习题'">
      <b>练习题</b><small>{{ practices.length }} 项已完成</small></button
    ><button :class="{ active: tab === '考试试卷' }" @click="tab = '考试试卷'">
      <b>考试试卷</b><small>{{ examPendingCount ? examPendingCount + ' 待批阅 · ' : '' }}{{ examRecords.length }} 项</small></button
    ><button :class="{ active: tab === '错题本' }" @click="tab = '错题本'">
      <b>错题本</b><small>我的记录</small>
    </button>
  </div>

  <!-- ============ 练习题 tab ============ -->
  <section v-if="tab === '练习题'" class="list-panel">
    <div class="list-head">
      <h2>练习题</h2>
      <span>已完成 · 按关联课程整理</span>
    </div>
    <div v-if="practices.length === 0" class="empty-soft">
      <p>还没有完成过练习。在「待学内容」里完成管理员指派的练习卷后，会自动归档到这里。</p>
      <el-button type="primary" plain @click="router.push('/todo')">去看待学内容 →</el-button>
    </div>
    <div v-for="p in practices" v-else :key="p.id" class="training-row">
      <div class="row-icon">练</div>
      <div class="row-main">
        <strong>{{ p.paperName }}</strong
        ><small>关联课程：{{ p.course }} · {{ p.questionCount }} 题 · 完成于 {{ p.finishedAt }} · 用时 {{ p.usedMinutes }} 分钟</small>
      </div>
      <div class="score-block practice-score">
        <b>{{ p.score }}<i> / {{ p.totalScore }}</i></b>
        <small>答对 {{ p.correctCount }} / {{ p.questionCount }}</small>
      </div>
      <button @click="gotoPracticePaper(p)">查看说明页 →</button>
    </div>
  </section>

  <!-- ============ 考试试卷 tab ============ -->
  <section v-else-if="tab === '考试试卷'" class="list-panel">
    <div class="list-head">
      <h2>考试试卷</h2>
      <span>
        <b>{{ examPassedCount }}</b> 次通过 ·
        <b>{{ examRecords.length }}</b> 次已考
        <template v-if="examPendingCount"> · <em>{{ examPendingCount }} 待批阅</em></template>
      </span>
    </div>
    <div v-if="examRecords.length === 0" class="empty-soft">
      <p>还没有参加过考试。完成管理员指派的考试后，会自动归档到这里。</p>
      <el-button type="primary" plain @click="router.push('/todo')">去看待学内容 →</el-button>
    </div>
    <div v-for="exam in examRecords" v-else :key="exam.id" class="training-row">
      <div class="row-icon exam-icon">卷</div>
      <div class="row-main">
        <strong>{{ exam.examName }}</strong>
        <small>
          {{ exam.totalScore ?? '?' }} 分 ·
          {{ exam.questionCount ?? '?' }} 题 ·
          用时 {{ exam.usedMinutes }} 分钟 ·
          完成于 {{ exam.finishedAt }}
          <template v-if="paperMeta(exam.paperId)?.deadline"> · 截止 {{ paperMeta(exam.paperId)?.deadline }}</template>
        </small>
      </div>
      <div
        class="score-block"
        :class="exam.score === '待批阅' ? 'score-pending' : exam.pass ? 'score-pass' : 'score-fail'"
      >
        <template v-if="exam.score !== '待批阅'">
          <b>{{ exam.score }}<i> / {{ exam.totalScore }}</i></b>
          <small>
            <template v-if="exam.passScore">及格线 {{ exam.passScore }} 分 · </template>
            答对 {{ exam.correctCount ?? '?' }} / {{ exam.questionCount ?? '?' }}
          </small>
        </template>
        <template v-else>
          <b class="pending-text">待批阅</b>
          <small>含简答题 · 人工阅卷中</small>
        </template>
      </div>
      <button @click="openReview(exam)">
        {{ exam.score === '待批阅' ? '查看详情' : '查看阅卷' }} →
      </button>
    </div>
  </section>

  <!-- ============ 错题本 tab ============ -->
  <section v-else class="notebook panel">
    <div class="list-head">
      <div>
        <h2>错题集</h2>
        <span>共 {{ notebookStore.items.length }} 题 · 点击行查看与编辑，右侧可直接删除</span>
      </div>
      <el-button type="primary" @click="openCreate">＋ 新增错题</el-button>
    </div>

    <div v-if="!notebookStore.items.length" class="wq-empty">
      <p>错题集还是空的，点右上角「新增错题」收录第一题吧～</p>
    </div>
    <div v-for="q in notebookStore.items" v-else :key="q.id" class="training-row" @click="openView(q)">
      <div class="row-icon wq-type-icon" :class="typeClass(q.type)">
        {{ typeShortLabel(q.type) }}
      </div>
      <div class="row-main">
        <strong>{{ q.title }}</strong>
        <small>
          <template v-if="q.course && q.course !== '未关联课程'"
            >关联课程：{{ q.course }} · </template
          >更新于 {{ q.updatedAt
          }}<template v-if="q.images.length"> · 🖼 {{ q.images.length }} 张图</template>
        </small>
      </div>
      <button class="danger" @click.stop="confirmRemove(q.id)">删除</button>
    </div>
  </section>

  <!-- ============ 错题 查看详情 / 编辑 / 新增 弹窗 ============ -->
  <el-dialog v-model="questionDialog.visible" :title="dialogTitle" width="620px">
    <!-- 隐藏的文件选择器：添加图片用 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      style="display: none"
      @change="onFilesChosen"
    />

    <!-- ===== 查看模式 ===== -->
    <div v-if="questionDialog.mode === 'view'" class="wq-detail">
      <div class="wq-meta">
        <span class="wq-type" :class="typeClass(form.type)">{{ form.type }}</span>
        <small v-if="form.course && form.course !== '未关联课程'"
          >关联课程：{{ form.course }}</small
        >
      </div>
      <h3 class="wq-title">{{ form.title }}</h3>
      <div class="wq-field">
        <span>我的答案</span>
        <p :class="{ wrong: true }">{{ form.myAnswer || '（未记录）' }}</p>
      </div>
      <div class="wq-field">
        <span>正确答案</span>
        <p class="right">{{ form.correctAnswer || '（未记录）' }}</p>
      </div>
      <div class="wq-field">
        <span>解析 / 笔记</span>
        <p class="analysis">{{ form.analysis || '（暂无解析）' }}</p>
      </div>
      <div v-if="form.images.length" class="wq-field">
        <span>题目图片</span>
        <div class="wq-images">
          <img v-for="img in form.images" :key="img.id" :src="img.url" :alt="img.name" />
        </div>
      </div>
      <small class="wq-time">收录于 {{ form.createdAt }} · 更新于 {{ form.updatedAt }}</small>
    </div>

    <!-- ===== 新增 / 编辑模式 ===== -->
    <div v-else class="wq-form">
      <label class="wq-row">
        <span>题干 *</span>
        <el-input
          v-model="form.title"
          type="textarea"
          :rows="3"
          resize="none"
          placeholder="例如：业务审批流程中，超过 10 万的合同需要谁审批？"
        />
      </label>
      <label class="wq-row">
        <span>题型</span>
        <el-select v-model="form.type" style="width: 100%">
          <el-option v-for="t in questionTypeOptions" :key="t" :label="t" :value="t" />
        </el-select>
      </label>
      <div class="wq-cols">
        <label class="wq-row">
          <span>我的答案</span>
          <el-input v-model="form.myAnswer" placeholder="当时选了什么 / 答了什么" />
        </label>
        <label class="wq-row">
          <span>正确答案</span>
          <el-input v-model="form.correctAnswer" placeholder="标准答案" />
        </label>
      </div>
      <label class="wq-row">
        <span>解析 / 笔记</span>
        <el-input
          v-model="form.analysis"
          type="textarea"
          :rows="3"
          resize="none"
          placeholder="写下你的理解，为什么错、正确的思路是什么"
        />
      </label>
      <div class="wq-row">
        <span>题目图片</span>
        <div class="wq-image-editor">
          <div v-for="img in form.images" :key="img.id" class="wq-thumb">
            <img :src="img.url" :alt="img.name" />
            <button class="wq-thumb-del" title="移除这张图" @click="removeImage(img.id)">✕</button>
          </div>
          <button class="wq-add-image" @click="pickImages">＋<br />图片</button>
        </div>
      </div>
    </div>

    <template #footer>
      <template v-if="questionDialog.mode === 'view'">
        <el-button @click="closeDialog">关闭</el-button>
        <el-button type="primary" @click="startEdit">✎ 编辑</el-button>
      </template>
      <template v-else>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveQuestion">保存到错题集</el-button>
      </template>
    </template>
  </el-dialog>

  <!-- ============ 阅卷结果查看 ============ -->
  <el-dialog
    v-model="reviewDialog"
    :title="`${reviewExam?.examName ?? ''} · 阅卷结果`"
    width="720px"
  >
    <div class="review-summary">
      <div class="review-score">
        <b>{{ reviewInfo.score }}</b>
        <span>分数</span>
      </div>
      <div class="review-meta">
        共 {{ reviewQuestions.length }} 题（演示节选） · 答错 {{ reviewInfo.wrong }} 题<br />
        提交时间 {{ reviewInfo.submittedAt }} · 已完成阅卷
      </div>
    </div>
    <div class="review-list">
      <div
        v-for="q in reviewQuestions"
        :key="q.id"
        class="review-item"
        :class="{ wrong: !q.correct }"
      >
        <div class="review-body">
          <div class="review-head">
            <span class="wq-type" :class="typeClass(q.type)">{{ q.type }}</span>
            <small>第 {{ q.no }} 题</small>
            <span class="review-state" :class="q.correct ? 'right' : 'wrong'">
              {{ q.correct ? '✓ 答对' : '✕ 答错' }}
            </span>
            <button
              class="add-wq"
              :class="{ added: !!addedMap[q.id] }"
              @click="toggleNotebook(q)"
            >
              {{ addedMap[q.id] ? '✓ 已加入错题' : '＋ 错题本' }}
            </button>
          </div>
          <h4>{{ q.title }}</h4>
          <div class="review-answers">
            <p>
              <span>我的答案</span>
              <b :class="q.correct ? 'right' : 'wrong'">{{ q.myAnswer }}</b>
            </p>
            <p v-if="!q.correct">
              <span>正确答案</span>
              <b class="right">{{ q.correctAnswer }}</b>
            </p>
          </div>
          <p class="review-analysis">{{ q.analysis }}</p>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="reviewDialog = false">关闭</el-button>
      <el-button type="primary" @click="tab = '错题本'; reviewDialog = false">
        查看错题集 →
      </el-button>
    </template>
  </el-dialog>
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
.list-head span b {
  color: var(--ink);
  font-weight: 700;
  margin: 0 2px;
}
.list-head span em {
  color: #b45309;
  font-style: normal;
  font-weight: 600;
}
.empty-soft {
  padding: 50px 20px;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.empty-soft p {
  margin: 0;
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
  flex: none;
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

/* ============ 成绩块（高亮重点）============ */
.score-block {
  flex: none;
  min-width: 140px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: #f6f8fa;
  text-align: right;
}
.score-block b {
  display: block;
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  color: var(--ink);
}
.score-block b i {
  font-style: normal;
  font-size: 13px;
  color: var(--muted);
  margin-left: 2px;
  font-weight: 500;
}
.score-block small {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 10px;
}

/* 通过：突出色 = 绿松石渐变 + 金边 */
.score-block.score-pass {
  background: linear-gradient(135deg, #ecfaf3, #d9f2e3);
  border-color: #5cb48f;
  box-shadow: 0 0 0 2px rgba(92, 180, 143, 0.12);
}
.score-block.score-pass b {
  color: #0f6e56;
}
.score-pass b i {
  color: #4a9b78;
}
/* 未通过：橙色 */
.score-block.score-fail {
  background: #fff5f0;
  border-color: #e08b5a;
}
.score-block.score-fail b {
  color: #c2410c;
}
/* 待批阅：暖黄 */
.score-block.score-pending {
  background: #fff8e1;
  border-color: #f0c97c;
}
.score-block.score-pending .pending-text {
  font-size: 17px;
  color: #b45309;
}

.training-row button {
  border: 1px solid #b8cfe7;
  background: var(--mint);
  color: var(--teal);
  padding: 7px 11px;
  cursor: pointer;
  font-size: 11px;
  flex: none;
}
/* ==================== 错题集 ==================== */
.notebook {
  padding: 0;
}
.notebook .list-head {
  padding: 18px 20px;
}
.wq-empty {
  padding: 46px 20px;
  text-align: center;
  color: var(--muted);
  font-size: 12px;
}
/* 错题集行：进入查看态；按钮做 @click.stop 拦截 */
.notebook .training-row {
  cursor: pointer;
  transition: background 0.15s;
}
.notebook .training-row:hover {
  background: #fafcfd;
}
/* 左侧方块按题型配色，复用 row-icon 尺寸 */
.wq-type-icon.wq-单选题 { background: var(--mint); color: var(--teal); }
.wq-type-icon.wq-多选题 { background: #ece9f7; color: #534ab7; }
.wq-type-icon.wq-判断题 { background: #def0e0; color: #0f6e56; }
.wq-type-icon.wq-简答题 { background: #faeeda; color: #b45309; }
/* 右侧"删除"按钮：红色 outline */
.training-row button.danger {
  border-color: #f0c9b8;
  background: #fff5f0;
  color: #c2410c;
}
.training-row button.danger:hover {
  background: #fde8dc;
  border-color: #e0a488;
}
/* 详情/表单弹窗 */
.wq-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.wq-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-size: 11px;
}
.wq-title {
  font-size: 16px;
  line-height: 1.6;
}
.wq-field {
  padding: 10px 12px;
  background: #fafcfb;
  border-radius: 6px;
}
.wq-field > span {
  display: block;
  font-size: 10px;
  color: var(--muted);
  margin-bottom: 4px;
  letter-spacing: 1px;
}
.wq-field p {
  font-size: 13px;
  margin: 0;
  line-height: 1.6;
}
.wq-field p.wrong {
  color: #b45309;
}
.wq-field p.right {
  color: var(--teal);
}
.wq-field p.analysis {
  color: var(--ink);
  white-space: pre-wrap;
}
.wq-time {
  color: var(--muted);
  font-size: 11px;
}
.wq-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.wq-images img {
  max-width: 100%;
  max-height: 180px;
  border: 1px solid var(--line);
  border-radius: 6px;
}

/* 编辑表单 */
.wq-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.wq-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.wq-row > span {
  font-size: 11px;
  color: var(--muted);
}
.wq-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.wq-image-editor {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.wq-thumb {
  position: relative;
  width: 78px;
  height: 78px;
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
}
.wq-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.wq-thumb-del {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 10px;
  line-height: 16px;
  cursor: pointer;
}
.wq-add-image {
  width: 78px;
  height: 78px;
  border: 1px dashed #b8cfe7;
  border-radius: 6px;
  background: var(--mint);
  color: var(--teal);
  font-size: 11px;
  line-height: 1.4;
  cursor: pointer;
}
.wq-add-image:hover {
  border-color: var(--teal);
}

/* ==================== 阅卷结果查看 ==================== */
.review-summary {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 18px;
  background: #fafcfb;
  border: 1px solid var(--line);
  border-radius: 8px;
  margin-bottom: 16px;
}
.review-score {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: var(--teal);
}
.review-score b {
  font-size: 34px;
  line-height: 1;
}
.review-score span {
  font-size: 11px;
  color: var(--muted);
}
.review-meta {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.9;
}
.review-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.review-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
}
.review-item.wrong {
  border-color: #f0d5bd;
  background: #fffaf5;
}
.add-wq {
  margin-left: auto;
  flex: none;
  padding: 4px 12px;
  border: 1px solid #b8cfe7;
  border-radius: 999px;
  background: var(--mint);
  color: var(--teal);
  font-size: 11px;
  line-height: 1.6;
  cursor: pointer;
  transition: all 0.15s;
}
.add-wq:hover:not(.added) {
  border-color: var(--teal);
}
.add-wq.added {
  border-color: var(--teal);
  background: var(--teal);
  color: #fff;
}
.review-body {
  flex: 1;
  min-width: 0;
}
.review-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.review-head small {
  color: var(--muted);
  font-size: 10px;
}
.review-state {
  font-size: 11px;
  font-weight: 700;
}
.review-state.right {
  color: var(--teal);
}
.review-state.wrong {
  color: #c2410c;
}
.review-body h4 {
  font-size: 13px;
  line-height: 1.6;
  margin: 8px 0;
}
.review-answers {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.review-answers p {
  margin: 0;
  padding: 6px 10px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-size: 12px;
}
.review-answers span {
  display: block;
  font-size: 10px;
  color: var(--muted);
  margin-bottom: 2px;
}
.review-answers b {
  font-weight: 600;
}
.review-answers b.wrong {
  color: #b45309;
}
.review-answers b.right {
  color: var(--teal);
}
.review-analysis {
  margin: 8px 0 0;
  font-size: 11px;
  color: var(--muted);
  line-height: 1.7;
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
  .score-block {
    margin-left: 55px;
  }
  .training-row button {
    margin-left: auto;
  }
}
</style>