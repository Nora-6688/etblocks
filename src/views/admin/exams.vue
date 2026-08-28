<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'

type Tab = '题库' | '试卷' | '阅卷列表'
type QuestionType = '单选题' | '多选题' | '判断题' | '填空题' | '问答题（人工判分）' | '问答题（系统判分）'
type Question = {
  title: string
  type: QuestionType
  difficulty: string
  course: string
  options: string[]
  correctAnswer: string
  correctAnswers: string[]
  hint: string
  blankOrder: string
  analysis: string
  tags: string
}
type Bank = { id: number; name: string; count: number; creator: string; questions: Question[] }
type Paper = {
  id: number
  name: string
  audience: string
  count: number
  pass: number
  duration: number
  status: string
  questions: { question: Question; score: number }[]
}

const tab = ref<Tab>('题库')
const markingTab = ref('待阅卷')
const selectedBank = ref<Bank | null>(null)
const selectedPaper = ref<Paper | null>(null)
const questionModeVisible = ref(false)
const questionEditorVisible = ref(false)
const paperEditorVisible = ref(false)
const editingQuestion = ref<Question | null>(null)
const excelImportVisible = ref(false)
const excelPreviewData = ref<{ rows: Record<string, string>[]; valid: boolean } | null>(null)
const nextBankId = ref(6)

/* ---------- 题库选择器（从题库添加题目到试卷） ---------- */
const bankPickerVisible = ref(false)
const bankPickerStep = ref<'bank' | 'question'>('bank')
const bankPickerBank = ref<Bank | null>(null)
const bankPickerSearch = ref('')
const bankPickerQuestionSearch = ref('')
const bankPickerSelected = ref<Set<Question>>(new Set())

const filteredBanks = computed(() => {
  const kw = bankPickerSearch.value.trim()
  return kw ? banks.value.filter((b) => b.name.includes(kw)) : banks.value
})
const filteredBankQuestions = computed(() => {
  const kw = bankPickerQuestionSearch.value.trim()
  const qs = bankPickerBank.value?.questions ?? []
  return kw ? qs.filter((q) => q.title.includes(kw)) : qs
})

function openBankPicker() {
  bankPickerStep.value = 'bank'
  bankPickerBank.value = null
  bankPickerSearch.value = ''
  bankPickerQuestionSearch.value = ''
  bankPickerSelected.value = new Set()
  bankPickerVisible.value = true
}
function pickBank(bank: Bank) {
  bankPickerBank.value = bank
  bankPickerStep.value = 'question'
  bankPickerQuestionSearch.value = ''
}
function togglePickQuestion(q: Question) {
  if (bankPickerSelected.value.has(q)) bankPickerSelected.value.delete(q)
  else bankPickerSelected.value.add(q)
}
function confirmPickQuestions() {
  if (!selectedPaper.value || bankPickerSelected.value.size === 0) return
  for (const q of bankPickerSelected.value) {
    if (!selectedPaper.value.questions.some((item) => item.question === q)) {
      selectedPaper.value.questions.push({ question: q, score: 5 })
      selectedPaper.value.count += 1
    }
  }
  bankPickerVisible.value = false
  ElMessage.success(`已添加 ${bankPickerSelected.value.size} 道题目到试卷`)
}
function removePaperQuestion(idx: number) {
  if (!selectedPaper.value) return
  selectedPaper.value.questions.splice(idx, 1)
  selectedPaper.value.count = selectedPaper.value.questions.length
  ElMessage.success('题目已移除')
}
function movePaperQuestion(idx: number, dir: -1 | 1) {
  if (!selectedPaper.value) return
  const arr = selectedPaper.value.questions
  const target = idx + dir
  if (target < 0 || target >= arr.length) return
  ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
}
const paperTotalScore = computed(() => {
  if (!selectedPaper.value) return 0
  return selectedPaper.value.questions.reduce((sum, q) => sum + (q.score || 0), 0)
})

function emptyQuestion(): Question {
  return { title: '', type: '单选题', difficulty: '入门', course: '', options: ['', '', '', ''], correctAnswer: '', correctAnswers: [], hint: '', blankOrder: '必须与答案完全一致', analysis: '', tags: '' }
}
const newQuestion = ref<Question>(emptyQuestion())
const newPaperName = ref('')
const newPaperAudience = ref('全司通用')
const newPaperPass = ref(60)
const newPaperDuration = ref(60)

const banks = ref<Bank[]>([
  { id: 1, name: '企业文化题库', count: 12, creator: 'Nora', questions: [{ ...emptyQuestion(), title: '公司核心价值观包括以下哪些？', type: '多选题', difficulty: '入门', course: '企业文化入门' }] },
  { id: 2, name: '业务流程题库', count: 18, creator: 'Nora', questions: [{ ...emptyQuestion(), title: '业务审批流程中，超过 10 万的合同需要谁审批？', type: '单选题', difficulty: '进阶', course: '业务流程规范' }] },
  { id: 3, name: '客服岗位题库', count: 15, creator: 'Nora', questions: [{ ...emptyQuestion(), title: '请描述客户投诉的标准处理流程。', type: '问答题（人工判分）', difficulty: '高级', course: '客户服务标准' }] },
  { id: 4, name: '产品知识题库', count: 20, creator: 'Nora', questions: [{ ...emptyQuestion(), title: '产品 A 的核心参数是什么？', type: '问答题（系统判分）', difficulty: '进阶', course: '产品知识体系' }] },
  { id: 5, name: '规章制度题库', count: 10, creator: 'Nora', questions: [] },
])
const papers = ref<Paper[]>([
  { id: 1, name: '新人入职综合考核', audience: '全司通用', count: 50, pass: 60, duration: 60, status: '已发布', questions: [
    { question: { ...emptyQuestion(), title: '公司核心价值观包括以下哪些？', type: '多选题', difficulty: '入门', course: '企业文化入门' }, score: 10 },
    { question: { ...emptyQuestion(), title: '超过10万的合同需要谁审批？', type: '单选题', difficulty: '进阶', course: '业务流程规范' }, score: 10 },
  ] },
  { id: 2, name: '业务知识季度考核', audience: '业务岗', count: 30, pass: 60, duration: 40, status: '已发布', questions: [
    { question: { ...emptyQuestion(), title: '业务审批流程中，超过 10 万的合同需要谁审批？', type: '单选题', difficulty: '进阶', course: '业务流程规范' }, score: 15 },
  ] },
  { id: 3, name: '规章制度专项测试', audience: '全司通用', count: 20, pass: 70, duration: 30, status: '草稿', questions: [] },
])
const pendingPapers = ref([
  { name: '业务知识季度考核', learner: 'Tommy', submitted: '2026.08.26', subjective: 2 },
  { name: '客服岗位能力测评', learner: 'Farry', submitted: '2026.08.25', subjective: 1 },
])
const markedPapers = ref([
  { name: '新人入职综合考核', learner: 'Selina', score: 92, markedAt: '2026.08.22', paperName: '新人入职综合考核' },
  { name: '规章制度专项测试', learner: 'Bling', score: 86, markedAt: '2026.08.20', paperName: '规章制度专项测试' },
])

const questions = computed(() => selectedBank.value?.questions ?? [])
const optionLetters = computed(() => newQuestion.value.options.map((_, index) => String.fromCharCode(65 + index)))

function selectBank(bank: Bank) { selectedBank.value = bank }
function selectPaper(paper: Paper) { selectedPaper.value = paper }
function createBank() {
  const id = nextBankId.value++
  banks.value.push({ id, name: `新建题库 ${id}`, count: 0, creator: 'Nora', questions: [] })
  ElMessage.success('题库已创建')
}
async function renameBank(bank: Bank) {
  const { value } = await ElMessageBox.prompt('请输入新的题库名称', '编辑题库', { inputValue: bank.name })
  if (value) { bank.name = value; ElMessage.success('题库名称已更新') }
}
function copyBank(bank: Bank) {
  const id = nextBankId.value++
  banks.value.push({ id, name: `${bank.name} 副本`, count: bank.count, creator: 'Nora', questions: bank.questions.map((question) => ({ ...question })) })
  ElMessage.success('题库已复制')
}
async function removeBank(bank: Bank) {
  await ElMessageBox.confirm(`确定删除《${bank.name}》吗？`, '删除题库', { type: 'warning' })
  banks.value = banks.value.filter((item) => item !== bank)
  ElMessage.success('题库已删除')
}
function openQuestionMode() { questionModeVisible.value = true }
function chooseQuestionMode(mode: string) {
  questionModeVisible.value = false
  if (mode === 'Excel录入') { excelImportVisible.value = true; return }
  newQuestion.value = emptyQuestion()
  editingQuestion.value = null
  questionEditorVisible.value = true
}

/* ---------- Excel 批量导入 ---------- */
const excelTemplateHeader = ['题型', '题干', '选项A', '选项B', '选项C', '选项D', '选项E', '选项F', '正确答案', '难度', '关联课程', '答案解析']

function downloadTemplate() {
  const sample = [
    ['单选题', '公司核心价值观包括以下哪些？', '诚信', '创新', '服务', '共赢', '', '', 'AC', '入门', '企业文化入门', '核心价值观为诚信与创新'],
    ['多选题', '以下哪些属于业务审批流程？', '提交申请', '部门审核', '财务审批', '归档', '', '', 'ABCD', '进阶', '业务流程规范', '标准四步审批流程'],
    ['判断题', '超过10万的合同需要总经理审批。', '', '', '', '', '', '', '正确', '高级', '业务流程规范', '超10万需总经理签批'],
    ['填空题', '公司全称为___，成立于___年。', '', '', '', '', '', '', '福特汽车公司|1903', '入门', '企业文化入门', '多个空用|分隔，多个正确答案也用|分隔'],
    ['问答题（人工判分）', '请描述客户投诉的标准处理流程。', '', '', '', '', '', '', '（人工阅卷评分）', '高级', '客户服务标准', '问答题由人工阅卷，无标准答案'],
    ['问答题（系统判分）', '福特服务承诺的核心关键词是什么？', '', '', '', '', '', '', '品质|诚信|进取', '进阶', '福特服务标准', '系统判分，答案需完全匹配'],
  ]
  const aoa = [excelTemplateHeader, ...sample]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = excelTemplateHeader.map(() => ({ wch: 16 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '试题模板')
  XLSX.writeFile(wb, '试题导入模板.xlsx')
  ElMessage.success('模板已下载')
}

function handleExcelUpload(file: { raw: File }) {
  const rawFile = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
      if (!rows.length) { ElMessage.warning('文件中没有数据'); return }
      excelPreviewData.value = { rows, valid: true }
      ElMessage.success(`已解析 ${rows.length} 道题目，请确认后导入`)
    } catch {
      ElMessage.error('文件解析失败，请检查格式是否正确')
    }
  }
  reader.readAsArrayBuffer(rawFile)
}

function confirmExcelImport() {
  if (!excelPreviewData.value || !selectedBank.value) return
  const rows = excelPreviewData.value.rows
  let imported = 0
  for (const row of rows) {
    const type = (row['题型'] || '').trim() as QuestionType
    const title = (row['题干'] || '').trim()
    if (!title) continue
    const options: string[] = []
    for (const col of ['选项A','选项B','选项C','选项D','选项E','选项F']) {
      const v = (row[col] || '').trim()
      if (v) options.push(v)
    }
    if (options.length < 2) options.push('', '')
    while (options.length < 4) options.push('')
    const correct = (row['正确答案'] || '').trim()
    const q: Question = {
      title,
      type: type || '单选题',
      difficulty: (row['难度'] || '入门').trim(),
      course: (row['关联课程'] || '').trim(),
      options,
      correctAnswer: correct,
      correctAnswers: correct.split('').filter(Boolean),
      hint: '',
      blankOrder: '必须与答案完全一致',
      analysis: (row['答案解析'] || '').trim(),
      tags: '',
    }
    selectedBank.value.questions.push(q)
    selectedBank.value.count += 1
    imported++
  }
  excelImportVisible.value = false
  excelPreviewData.value = null
  ElMessage.success(`成功导入 ${imported} 道题目`)
}
function editQuestion(question: Question) {
  editingQuestion.value = question
  newQuestion.value = { ...question, options: [...question.options], correctAnswers: [...question.correctAnswers] }
  questionEditorVisible.value = true
}
function addOption() { if (newQuestion.value.options.length < 10) newQuestion.value.options.push('') }
function removeOption(index: number) { if (newQuestion.value.options.length > 2) newQuestion.value.options.splice(index, 1) }
function saveQuestion() {
  if (!newQuestion.value.title.trim() || !selectedBank.value) { ElMessage.warning('请填写题干内容'); return }
  const saved = { ...newQuestion.value, options: [...newQuestion.value.options], correctAnswers: [...newQuestion.value.correctAnswers] }
  if (editingQuestion.value) {
    const idx = selectedBank.value.questions.indexOf(editingQuestion.value)
    if (idx !== -1) selectedBank.value.questions[idx] = saved
    ElMessage.success('题目已更新')
  } else {
    selectedBank.value.questions.push(saved)
    selectedBank.value.count += 1
    ElMessage.success('题目已录入')
  }
  editingQuestion.value = null
  questionEditorVisible.value = false
}
function removeQuestion(question: Question) {
  if (!selectedBank.value) return
  selectedBank.value.questions = selectedBank.value.questions.filter((item) => item !== question)
  selectedBank.value.count -= 1
  ElMessage.success('题目已删除')
}
function createPaper() { paperEditorVisible.value = true }
function savePaper() {
  if (!newPaperName.value.trim()) { ElMessage.warning('请输入试卷名称'); return }
  papers.value.unshift({ id: Date.now(), name: newPaperName.value, audience: newPaperAudience.value, count: 0, pass: newPaperPass.value, duration: newPaperDuration.value, status: '草稿' })
  newPaperName.value = ''
  paperEditorVisible.value = false
  ElMessage.success('试卷已创建')
}
function publishPaper(paper: Paper) { paper.status = '已发布'; ElMessage.success('试卷已发布') }
function copyPaper(paper: Paper) {
  const copy: Paper = {
    id: Date.now(),
    name: `${paper.name} 副本`,
    audience: paper.audience,
    count: paper.count,
    pass: paper.pass,
    duration: paper.duration,
    status: '草稿',
    questions: paper.questions.map((item) => ({ question: item.question, score: item.score })),
  }
  papers.value.push(copy)
  ElMessage.success('试卷已复制')
}
async function removePaper(paper: Paper) {
  await ElMessageBox.confirm(`确定删除《${paper.name}》吗？`, '删除试卷', { type: 'warning' })
  papers.value = papers.value.filter((item) => item !== paper)
  ElMessage.success('试卷已删除')
}

/* ---------- 自动批改 & 分享 ---------- */
const markDetailVisible = ref(false)
const markDetailData = ref<{ name: string; learner: string; items: { title: string; type: string; correct: boolean; score: number; userAnswer: string; correctAnswer: string }[] } | null>(null)
const shareVisible = ref(false)
const sharePaper = ref<{ name: string; learner: string; score: number } | null>(null)
const shareLink = ref('')

function autoMark(pending: { name: string; learner: string; submitted: string; subjective: number }) {
  const paper = papers.value.find((p) => p.name === pending.name)
  const totalScore = paper?.questions.reduce((s, q) => s + q.score, 0) ?? 100
  const correctRate = 0.82 + Math.random() * 0.12
  const score = Math.round(totalScore * correctRate)
  markedPapers.value.unshift({
    name: pending.name,
    learner: pending.learner,
    score,
    markedAt: '2026.08.27',
    paperName: pending.name,
  })
  pendingPapers.value = pendingPapers.value.filter((p) => p !== pending)
  ElMessage.success(`${pending.learner} 的试卷已自动批改，得分 ${score} 分，成绩提醒已发送给学员`)
}

function viewMarkDetail(marked: { name: string; learner: string; score: number }) {
  const paper = papers.value.find((p) => p.name === marked.name)
  markDetailData.value = {
    name: marked.name,
    learner: marked.learner,
    items: (paper?.questions ?? []).map((item, i) => ({
      title: item.question.title,
      type: item.question.type,
      correct: i % 3 !== 2,
      score: item.score,
      userAnswer: i % 3 !== 2 ? item.question.correctAnswer : (item.question.options[0] || 'A'),
      correctAnswer: item.question.correctAnswer,
    })),
  }
  markDetailVisible.value = true
}

function openShare(marked: { name: string; learner: string; score: number }) {
  sharePaper.value = marked
  shareLink.value = `${window.location.origin}/exam-result?paper=${encodeURIComponent(marked.name)}&learner=${encodeURIComponent(marked.learner)}&score=${marked.score}`
  shareVisible.value = true
}

function copyShareLink() {
  navigator.clipboard.writeText(shareLink.value)
  ElMessage.success('链接已复制，可粘贴到企业微信或邮件中分享')
}
</script>

<template>
  <section class="page-header"><div><h1>考试管理</h1><p>题库管理、试卷组卷、阅卷批改</p></div></section>
  <div class="tabs"><button v-for="item in ['题库','试卷','阅卷列表']" :key="item" :class="{ active: tab === item }" @click="tab = item as Tab; selectedBank = null; selectedPaper = null">{{ item }}<b v-if="item === '阅卷列表'">2</b></button></div>

  <template v-if="tab === '题库'">
    <section v-if="!selectedBank" class="content-view">
      <div class="section-head"><div><h2>题库分类</h2><span>先创建或选择题库分类，再录入题目</span></div><el-button type="primary" @click="createBank">＋ 创建题库</el-button></div>
      <div class="table-wrap"><table><thead><tr><th>序号</th><th>题库名称</th><th>题量</th><th>创建人</th><th>操作</th></tr></thead><tbody>
        <tr v-for="bank in banks" :key="bank.id">
          <td>{{ bank.id }}</td>
          <td><span>{{ bank.name }}</span></td>
          <td>{{ bank.count }} 道</td>
          <td>{{ bank.creator }}</td>
          <td><button class="table-action" @click="selectBank(bank)">试题</button><button class="table-action" @click="renameBank(bank)">编辑</button><button class="table-action" @click="copyBank(bank)">复制</button><button class="table-action danger" @click="removeBank(bank)">删除</button></td>
        </tr>
      </tbody></table></div>
    </section>
    <section v-else class="content-view">
      <div class="section-head"><div><button class="back" @click="selectedBank = null">← 返回题库分类</button><h2>{{ selectedBank.name }}</h2><span>{{ selectedBank.count }} 道题目</span></div><el-button type="primary" @click="openQuestionMode">＋ 添加题目</el-button></div>
      <div class="table-wrap"><table><thead><tr><th>题目内容</th><th>类型</th><th>难度</th><th>关联课程</th><th>操作</th></tr></thead><tbody>
        <tr v-for="question in questions" :key="question.title">
          <td>{{ question.title }}</td>
          <td><span class="type-tag">{{ question.type }}</span></td>
          <td>{{ question.difficulty }}</td>
          <td>{{ question.course || '-' }}</td>
          <td><button class="table-action" @click="editQuestion(question)">编辑</button><button class="table-action danger" @click="removeQuestion(question)">删除</button></td>
        </tr>
        <tr v-if="!questions.length"><td colspan="5" class="empty">当前题库暂无题目，点击"添加题目"开始录入。</td></tr>
      </tbody></table></div>
    </section>
  </template>

  <template v-else-if="tab === '试卷'">
    <section v-if="!selectedPaper" class="content-view">
      <div class="section-head"><div><h2>试卷列表</h2><span>创建试卷后可继续编辑、发布或复制副本</span></div><el-button type="primary" @click="createPaper">＋ 新建试卷</el-button></div>
      <div class="table-wrap"><table><thead><tr><th>试卷名称</th><th>适用人群</th><th>题量</th><th>及格分数</th><th>时长</th><th>状态</th><th>操作</th></tr></thead><tbody>
        <tr v-for="paper in papers" :key="paper.id">
          <td>{{ paper.name }}</td>
          <td>{{ paper.audience }}</td>
          <td>{{ paper.count }} 题</td>
          <td>{{ paper.pass }} 分</td>
          <td>{{ paper.duration }} 分钟</td>
          <td><span class="status" :class="paper.status === '已发布' ? 'published' : ''">{{ paper.status }}</span></td>
          <td><button class="table-action" @click="selectPaper(paper)">编辑</button><button class="table-action" @click="copyPaper(paper)">复制</button><button v-if="paper.status === '草稿'" class="table-action" @click="publishPaper(paper)">发布</button><button class="table-action danger" @click="removePaper(paper)">删除</button></td>
        </tr>
      </tbody></table></div>
    </section>
    <section v-else class="content-view">
      <button class="back" @click="selectedPaper = null">← 返回试卷列表</button>
      <div class="section-head"><h2>编辑试卷</h2><el-button type="primary" @click="publishPaper(selectedPaper)">保存并发布</el-button></div>
      <div class="paper-edit-form">
        <div class="form-row"><label>试卷名称</label><el-input v-model="selectedPaper.name" placeholder="请输入试卷名称" /></div>
        <div class="form-row"><label>适用人群</label><el-select v-model="selectedPaper.audience" style="width:100%"><el-option v-for="item in ['全司通用','业务岗','客服岗','商务岗','产品岗','职能岗']" :key="item" :label="item" :value="item"/></el-select></div>
        <div class="form-row"><label>及格分数</label><el-input-number v-model="selectedPaper.pass" :min="0" :max="100" /> 分</div>
        <div class="form-row"><label>考试时长</label><el-input-number v-model="selectedPaper.duration" :min="5" :max="240" /> 分钟</div>
      </div>
      <div class="section-head" style="margin-top:24px"><div><h3>试卷内容</h3><span>共 {{ selectedPaper.questions.length }} 题 · 总分 {{ paperTotalScore }} 分</span></div><el-button type="primary" @click="openBankPicker">＋ 从题库添加题目</el-button></div>
      <div v-if="selectedPaper.questions.length" class="table-wrap"><table><thead><tr><th>序号</th><th>题目内容</th><th>类型</th><th>难度</th><th>分值</th><th>操作</th></tr></thead><tbody>
        <tr v-for="(item, idx) in selectedPaper.questions" :key="idx">
          <td>{{ idx + 1 }}</td>
          <td class="ellipsis">{{ item.question.title }}</td>
          <td><span class="type-tag">{{ item.question.type }}</span></td>
          <td>{{ item.question.difficulty }}</td>
          <td><el-input-number v-model="item.score" :min="1" :max="100" :step="5" size="small" /></td>
          <td>
            <button type="button" class="table-action" :disabled="idx === 0" @click="movePaperQuestion(idx, -1)">上移</button>
            <button type="button" class="table-action" :disabled="idx === selectedPaper.questions.length - 1" @click="movePaperQuestion(idx, 1)">下移</button>
            <button type="button" class="table-action danger" @click="removePaperQuestion(idx)">移除</button>
          </td>
        </tr>
      </tbody></table></div>
      <div v-else class="empty">暂无题目，点击"从题库添加题目"开始组卷。</div>
    </section>
  </template>

  <template v-else>
    <div class="mark-tabs"><button :class="{active: markingTab === '待阅卷'}" @click="markingTab = '待阅卷'">待阅卷 <b>{{ pendingPapers.length }}</b></button><button :class="{active: markingTab === '已阅'}" @click="markingTab = '已阅'">已阅</button></div>
    <div class="table-wrap">
      <table v-if="markingTab === '待阅卷'"><thead><tr><th>试卷名称</th><th>学员</th><th>提交时间</th><th>主观题</th><th>操作</th></tr></thead><tbody>
        <tr v-for="paper in pendingPapers" :key="paper.learner"><td>{{ paper.name }}</td><td>{{ paper.learner }}</td><td>{{ paper.submitted }}</td><td>{{ paper.subjective }} 题</td><td><button class="table-action" @click="autoMark(paper)">自动批改</button></td></tr>
      </tbody></table>
      <table v-else><thead><tr><th>试卷名称</th><th>学员</th><th>成绩</th><th>阅卷时间</th><th>状态</th><th>操作</th></tr></thead><tbody>
        <tr v-for="paper in markedPapers" :key="paper.learner"><td>{{ paper.name }}</td><td>{{ paper.learner }}</td><td>{{ paper.score }} 分</td><td>{{ paper.markedAt }}</td><td><span class="status published">已阅</span></td><td><button class="table-action" @click="viewMarkDetail(paper)">查看详情</button><button class="table-action" @click="openShare(paper)">分享</button></td></tr>
      </tbody></table>
    </div>
  </template>

  <el-dialog v-model="questionModeVisible" title="添加题目" width="390px">
    <p class="dialog-copy">选择题目录入方式</p>
    <div class="mode-options">
      <button type="button" @click="chooseQuestionMode('手动录入')"><b>手动录入</b><span>逐题填写题型、题干和答案</span></button>
      <button type="button" @click="chooseQuestionMode('Excel录入')"><b>Excel 录入</b><span>选择 Excel 文件批量导入题目</span></button>
    </div>
  </el-dialog>

  <el-dialog v-model="excelImportVisible" title="批量导入试题" width="560px">
    <div class="excel-import">
      <div class="import-step">
        <p class="step-label"><b>① 下载试题模板</b></p>
        <p class="step-desc">下载标准模板，按格式填写试题内容</p>
        <el-button type="primary" plain @click="downloadTemplate">下载试题模板</el-button>
      </div>
      <div class="import-step">
        <p class="step-label"><b>② 上传填写好的试题表</b></p>
        <p class="step-desc">支持 .xlsx / .xls 格式，单次最多导入 100 道题目</p>
        <el-upload :auto-upload="false" :show-file-list="false" accept=".xlsx,.xls" :on-change="handleExcelUpload">
          <el-button type="primary">选择文件</el-button>
        </el-upload>
      </div>
      <div v-if="excelPreviewData" class="import-step">
        <p class="step-label"><b>③ 预览确认</b></p>
        <p class="step-desc">已解析 {{ excelPreviewData.rows.length }} 道题目，确认无误后点击导入</p>
        <div class="preview-table">
          <table><thead><tr><th>题型</th><th>题干</th><th>正确答案</th><th>难度</th></tr></thead><tbody>
            <tr v-for="(row, i) in excelPreviewData.rows.slice(0, 5)" :key="i"><td>{{ row['题型'] }}</td><td class="ellipsis">{{ row['题干'] }}</td><td>{{ row['正确答案'] }}</td><td>{{ row['难度'] }}</td></tr>
          </tbody></table>
          <p v-if="excelPreviewData.rows.length > 5" class="more-tip">仅显示前 5 条，共 {{ excelPreviewData.rows.length }} 条</p>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="excelImportVisible = false">取消</el-button>
      <el-button type="primary" :disabled="!excelPreviewData" @click="confirmExcelImport">导入题目</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="questionEditorVisible" :title="editingQuestion ? '编辑题目' : '手动录入题目'" width="600px" class="question-dialog">
    <div class="type-picker">
      <label v-for="item in ['单选题','多选题','判断题','填空题','问答题（人工判分）','问答题（系统判分）']" :key="item" class="type-option" :class="{ active: newQuestion.type === item }">
        <input type="radio" name="question-type" :value="item" v-model="newQuestion.type" />{{ item }}
      </label>
    </div>
    <el-form label-position="top">
      <el-form-item label="题干">
        <el-input v-model="newQuestion.title" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="请输入题干" />
      </el-form-item>
      <el-form-item label="图片（可选）">
        <label class="image-upload">+ 添加图片<input type="file" accept="image/*" @change="ElMessage.info('图片将在文件服务接入后启用')" /></label>
        <small class="image-hint">支持 jpg、jpeg、gif、png，单张不超过 5M</small>
      </el-form-item>

      <template v-if="newQuestion.type === '单选题' || newQuestion.type === '多选题'">
        <el-form-item label="选项">
          <div v-for="(option, index) in newQuestion.options" :key="index" class="option-row">
            <span class="option-letter">{{ optionLetters[index] }}</span>
            <el-input v-model="newQuestion.options[index]" maxlength="500" placeholder="请输入选项内容" />
            <button type="button" class="option-remove" :disabled="newQuestion.options.length <= 2" @click="removeOption(index)">×</button>
          </div>
          <button type="button" class="add-option" @click="addOption">＋ 添加选项</button><small>请添加 2-10 个选项</small>
        </el-form-item>
        <el-form-item label="正确答案">
          <el-radio-group v-if="newQuestion.type === '单选题'" v-model="newQuestion.correctAnswer">
            <el-radio v-for="letter in optionLetters" :key="letter" :label="letter">{{ letter }}</el-radio>
          </el-radio-group>
          <el-checkbox-group v-else v-model="newQuestion.correctAnswers">
            <el-checkbox v-for="letter in optionLetters" :key="letter" :label="letter">{{ letter }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </template>

      <template v-else-if="newQuestion.type === '判断题'">
        <el-form-item label="正确答案">
          <el-radio-group v-model="newQuestion.correctAnswer"><el-radio label="正确">正确</el-radio><el-radio label="错误">错误</el-radio></el-radio-group>
        </el-form-item>
      </template>

      <template v-else-if="newQuestion.type === '填空题'">
        <el-form-item label="提示">
          <p class="field-hint">填空题为系统判分，答题者提交内容与答案完全一致，如字母大小写、空格、标点符号中英文等，建议设置多个正确答案进行兼容；多个空时所有空对才可得分；如遇判卷问题可查看学员答卷人工改分。</p>
        </el-form-item>
        <el-form-item label="正确答案">
          <el-input v-model="newQuestion.correctAnswer" placeholder='一个空允许多个正确答案，使用"|"分隔' />
        </el-form-item>
        <el-form-item label="填空顺序">
          <el-radio-group v-model="newQuestion.blankOrder"><el-radio label="必须与答案完全一致">必须与答案完全一致</el-radio><el-radio label="允许调换顺序">允许调换顺序</el-radio></el-radio-group>
        </el-form-item>
      </template>

      <template v-else-if="newQuestion.type === '问答题（人工判分）'">
        <p class="field-hint">问答题没有标准答案，需要人工阅卷</p>
      </template>

      <template v-else>
        <el-form-item label="正确答案">
          <el-input v-model="newQuestion.correctAnswer" type="textarea" :rows="2" placeholder="请输入系统判分依据的标准答案" />
        </el-form-item>
      </template>

      <el-form-item label="答案解析（可选）">
        <el-input v-model="newQuestion.analysis" type="textarea" :rows="3" maxlength="1000" show-word-limit placeholder="请输入答案解析" />
      </el-form-item>
      <el-form-item v-if="newQuestion.type === '判断题' || newQuestion.type.startsWith('问答题')" label="标签">
        <el-input v-model="newQuestion.tags" placeholder="输入标签后按回车新增" />
      </el-form-item>
      <el-form-item label="关联课程 / 难度">
        <el-input v-model="newQuestion.course" placeholder="关联课程" style="width:60%" />
        <el-select v-model="newQuestion.difficulty" style="width:36%;margin-left:4%"><el-option label="入门" value="入门"/><el-option label="进阶" value="进阶"/><el-option label="高级" value="高级"/></el-select>
      </el-form-item>
    </el-form>
    <template #footer><el-button @click="questionEditorVisible = false">取消</el-button><el-button type="primary" @click="saveQuestion">{{ editingQuestion ? '保存修改' : '保存题目' }}</el-button></template>
  </el-dialog>

  <el-dialog v-model="paperEditorVisible" title="新建试卷" width="520px">
    <el-form label-position="top">
      <el-form-item label="试卷名称"><el-input v-model="newPaperName" placeholder="请输入试卷名称" /></el-form-item>
      <el-form-item label="适用人群"><el-select v-model="newPaperAudience" style="width:100%"><el-option v-for="item in ['全司通用','业务岗','客服岗','商务岗','产品岗','职能岗']" :key="item" :label="item" :value="item"/></el-select></el-form-item>
      <el-form-item label="及格分数 / 考试时长"><el-input-number v-model="newPaperPass" :min="0" :max="100"/><el-input-number v-model="newPaperDuration" :min="5" :max="240" style="margin-left:12px"/></el-form-item>
    </el-form>
    <template #footer><el-button @click="paperEditorVisible = false">取消</el-button><el-button type="primary" @click="savePaper">创建试卷</el-button></template>
  </el-dialog>

  <el-dialog v-model="bankPickerVisible" :title="bankPickerStep === 'bank' ? '从题库添加题目' : `选择题目 - ${bankPickerBank?.name ?? ''}`" width="680px">
    <template v-if="bankPickerStep === 'bank'">
      <div class="picker-search"><el-input v-model="bankPickerSearch" placeholder="搜索题库名称" clearable /></div>
      <div class="picker-list">
        <div v-for="bank in filteredBanks" :key="bank.id" class="picker-item" @click="pickBank(bank)">
          <div><b>{{ bank.name }}</b><span>{{ bank.count }} 道题目</span></div>
          <span class="picker-arrow">→</span>
        </div>
        <div v-if="!filteredBanks.length" class="empty">未找到匹配的题库</div>
      </div>
    </template>
    <template v-else>
      <div class="picker-toolbar">
        <el-input v-model="bankPickerQuestionSearch" placeholder="搜索题目内容" clearable style="flex:1" />
        <span class="picker-count">已选 {{ bankPickerSelected.size }} 题</span>
      </div>
      <div class="picker-list">
        <label v-for="q in filteredBankQuestions" :key="q.title" class="picker-question" :class="{ checked: bankPickerSelected.has(q) }">
          <input type="checkbox" :checked="bankPickerSelected.has(q)" @change="togglePickQuestion(q)" />
          <span class="type-tag">{{ q.type }}</span>
          <span class="picker-question-title">{{ q.title }}</span>
          <span class="picker-question-diff">{{ q.difficulty }}</span>
        </label>
        <div v-if="!filteredBankQuestions.length" class="empty">未找到匹配的题目</div>
      </div>
    </template>
    <template #footer>
      <el-button v-if="bankPickerStep === 'question'" @click="bankPickerStep = 'bank'">上一步</el-button>
      <el-button @click="bankPickerVisible = false">取消</el-button>
      <el-button v-if="bankPickerStep === 'question'" type="primary" :disabled="bankPickerSelected.size === 0" @click="confirmPickQuestions">确定（{{ bankPickerSelected.size }}）</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="markDetailVisible" title="答题详情" width="680px">
    <template v-if="markDetailData">
      <div class="mark-summary"><span>试卷：{{ markDetailData.name }}</span><span>学员：{{ markDetailData.learner }}</span></div>
      <div class="mark-detail-list">
        <div v-for="(item, i) in markDetailData.items" :key="i" class="mark-detail-item" :class="{ wrong: !item.correct }">
          <div class="mark-detail-head"><span class="type-tag">{{ item.type }}</span><span class="mark-detail-title">{{ i + 1 }}. {{ item.title }}</span><span class="mark-detail-score">{{ item.correct ? `+${item.score}` : '0' }} 分</span></div>
          <div class="mark-detail-ans"><span>学员作答：</span><b>{{ item.userAnswer || '未作答' }}</b></div>
          <div class="mark-detail-ans"><span>正确答案：</span><b class="correct-text">{{ item.correctAnswer || '人工阅卷' }}</b></div>
        </div>
      </div>
    </template>
    <template #footer><el-button @click="markDetailVisible = false">关闭</el-button></template>
  </el-dialog>

  <el-dialog v-model="shareVisible" title="分享成绩" width="500px">
    <template v-if="sharePaper">
      <div class="share-info">
        <p>试卷：<b>{{ sharePaper.name }}</b></p>
        <p>学员：<b>{{ sharePaper.learner }}</b></p>
        <p>成绩：<b class="score-highlight">{{ sharePaper.score }} 分</b></p>
      </div>
      <div class="share-link-wrap">
        <p class="share-label">分享链接：</p>
        <el-input v-model="shareLink" readonly>
          <template #append><el-button @click="copyShareLink">复制链接</el-button></template>
        </el-input>
      </div>
      <div class="share-channels">
        <p class="share-label">分享到：</p>
        <div class="channel-buttons">
          <button type="button" class="channel-btn" @click="ElMessage.success('已生成企业微信分享卡片')">企业微信</button>
          <button type="button" class="channel-btn" @click="copyShareLink">复制链接</button>
          <button type="button" class="channel-btn" @click="ElMessage.success('已生成邮件分享链接')">邮件</button>
        </div>
      </div>
      <p class="share-tip">链接有效期为 30 天，打开后可查看试卷答题详情和成绩。</p>
    </template>
    <template #footer><el-button @click="shareVisible = false">关闭</el-button></template>
  </el-dialog>
</template>

<style scoped>
.page-header{margin-bottom:20px}
.page-header h1{font-size:20px;font-weight:600}
.page-header p,.section-head span,.paper-info{color:var(--muted);font-size:12px;margin-top:3px}
.tabs,.mark-tabs{display:flex;border-bottom:1px solid var(--line);margin-bottom:18px}
.tabs button,.mark-tabs button{padding:10px 18px;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--muted);cursor:pointer;font-size:13px}
.tabs button.active,.mark-tabs button.active{border-bottom-color:var(--teal);color:var(--teal);font-weight:600}
.tabs b,.mark-tabs b{display:inline-grid;place-items:center;min-width:18px;height:18px;margin-left:4px;border-radius:9px;background:#e24b4a;color:#fff;font-size:10px}
.section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.section-head h2,.content-view>h2{font-size:16px;font-weight:600}
.back{padding:0;border:0;background:none;color:var(--teal);cursor:pointer;font-size:12px;margin-bottom:7px}
.table-wrap{overflow:auto;border:1px solid var(--line);border-radius:9px;background:#fff}
table{width:100%;min-width:700px;border-collapse:collapse}
th,td{padding:13px 16px;border-bottom:1px solid var(--line);text-align:left;font-size:12px}
th{background:#fafbfc;color:var(--muted);font-weight:500}
td{color:#233e61}
tr:last-child td{border-bottom:0}
.bank-link{color:var(--teal);cursor:pointer;font-weight:500}
.type-tag,.status{display:inline-block;padding:3px 8px;border-radius:10px;background:var(--mint);color:var(--teal);font-size:10px}
.status{background:#faeeda;color:#b45309}
.status.published{background:#e1f5ee;color:#0f6e56}
.table-action{padding:5px 9px;margin-right:5px;border:1px solid var(--line);border-radius:5px;background:#fff;color:#52677e;cursor:pointer;font-size:11px}
.table-action.danger{color:#a32d2d}
.empty{text-align:center;color:var(--muted);padding:35px}
.paper-actions{display:flex;gap:9px;margin-top:20px}
.dialog-copy{color:var(--muted);font-size:12px}
.mode-options{display:grid;gap:10px;margin-top:15px}
.mode-options button{display:grid;gap:3px;padding:14px;border:1px solid var(--line);border-radius:8px;background:#fff;text-align:left;cursor:pointer}
.mode-options button:hover{border-color:var(--teal);background:var(--mint)}
.mode-options b{font-size:13px}
.mode-options span{color:var(--muted);font-size:11px}
.type-picker{display:flex;flex-wrap:wrap;gap:16px;padding-bottom:14px;margin-bottom:14px;border-bottom:1px solid var(--line)}
.type-option{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:13px;cursor:pointer}
.type-option.active{color:var(--teal);font-weight:600}
.field-hint{color:var(--muted);font-size:12px;line-height:1.7}
.image-upload{display:inline-grid;place-items:center;width:110px;height:76px;border:1px dashed var(--line);border-radius:6px;color:var(--teal);cursor:pointer;font-size:12px}
.image-upload input{display:none}
.image-hint{display:block;margin-top:6px;color:var(--muted);font-size:11px}
.option-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.option-letter{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--mint);color:var(--teal);font-size:11px;font-weight:600}
.option-remove{border:0;background:none;color:#a32d2d;cursor:pointer;font-size:15px}
.option-remove:disabled{color:#cbd5df;cursor:not-allowed}
.add-option{border:0;background:none;color:var(--teal);cursor:pointer;font-size:12px;margin-right:8px}
@media(max-width:700px){
  .section-head{align-items:flex-start;gap:12px}
  .paper-actions{flex-wrap:wrap}
}
.excel-import{display:flex;flex-direction:column;gap:20px}
.import-step{padding:16px;border:1px solid var(--line);border-radius:8px;background:#fafbfc}
.step-label{margin-bottom:4px}
.step-label b{font-size:13px;color:var(--ink)}
.step-desc{color:var(--muted);font-size:11px;margin-bottom:12px}
.upload-tip{margin-left:10px;color:var(--muted);font-size:11px}
.preview-table{margin-top:8px;overflow:auto;max-height:200px;border:1px solid var(--line);border-radius:6px}
.preview-table table{width:100%;border-collapse:collapse}
.preview-table th,.preview-table td{padding:8px 10px;border-bottom:1px solid var(--line);font-size:11px;text-align:left}
.preview-table th{background:#f7faf9;color:var(--muted);font-weight:500}
.preview-table td{color:#233e61}
.preview-table .ellipsis{max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.more-tip{color:var(--muted);font-size:11px;margin-top:8px;text-align:center}
.paper-edit-form{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:20px;border:1px solid var(--line);border-radius:9px;background:#fff}
.form-row{display:flex;align-items:center;gap:8px}
.form-row label{width:70px;flex-shrink:0;color:var(--muted);font-size:12px}
.form-row .el-input-number{width:130px}
.picker-search{margin-bottom:12px}
.picker-list{max-height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:8px}
.picker-item{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid var(--line);border-radius:8px;background:#fff;cursor:pointer;transition:border-color .15s}
.picker-item:hover{border-color:var(--teal);background:var(--mint)}
.picker-item b{font-size:13px}
.picker-item span{color:var(--muted);font-size:11px;margin-left:8px}
.picker-arrow{color:var(--teal);font-size:16px}
.picker-toolbar{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.picker-count{color:var(--teal);font-size:12px;white-space:nowrap}
.picker-question{display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:#fff;cursor:pointer;transition:border-color .15s}
.picker-question:hover{border-color:var(--teal)}
.picker-question.checked{border-color:var(--teal);background:var(--mint)}
.picker-question input{width:16px;height:16px}
.picker-question-title{flex:1;font-size:12px;color:#233e61;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.picker-question-diff{color:var(--muted);font-size:11px;white-space:nowrap}
@media(max-width:700px){
  .paper-edit-form{grid-template-columns:1fr}
}
.mark-summary{display:flex;gap:20px;padding:12px 0 16px;border-bottom:1px solid var(--line);font-size:13px;color:var(--ink)}
.mark-detail-list{max-height:400px;overflow-y:auto;padding-top:8px}
.mark-detail-item{padding:12px;margin-bottom:8px;border:1px solid var(--line);border-radius:8px;background:#fafbfc}
.mark-detail-item.wrong{border-color:#f3c9c9;background:#fef7f7}
.mark-detail-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.mark-detail-title{flex:1;font-size:12px;color:#233e61}
.mark-detail-score{font-size:12px;color:var(--teal);font-weight:600;white-space:nowrap}
.mark-detail-item.wrong .mark-detail-score{color:#a32d2d}
.mark-detail-ans{font-size:11px;color:var(--muted);margin:3px 0}
.mark-detail-ans b{color:#233e61;font-weight:500}
.mark-detail-ans .correct-text{color:var(--teal)}
.share-info{padding:16px;border:1px solid var(--line);border-radius:8px;background:#fafbfc;margin-bottom:16px}
.share-info p{margin:4px 0;font-size:13px}
.share-info b{color:var(--ink)}
.score-highlight{color:#0f6e56;font-size:16px}
.share-label{color:var(--muted);font-size:12px;margin-bottom:8px}
.share-link-wrap{margin-bottom:16px}
.share-channels{margin-bottom:12px}
.channel-buttons{display:flex;gap:10px}
.channel-btn{padding:8px 16px;border:1px solid var(--line);border-radius:6px;background:#fff;color:var(--teal);cursor:pointer;font-size:12px}
.channel-btn:hover{border-color:var(--teal);background:var(--mint)}
.share-tip{color:var(--muted);font-size:11px;margin-top:8px}
</style>
