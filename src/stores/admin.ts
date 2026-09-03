import { defineStore } from 'pinia'

/**
 * 管理端共享数据：学员档案（含学习评价状态）+ 阅卷队列。
 * 数据目前为原型种子，Phase 4+ 接 Supabase 后替换为接口数据。
 */

export type AdminStudent = {
  name: string
  phone: string
  email: string
  department: string
  role: string
  workId: string
  joined: string
  completed: string
  progress: string
  status: string
  password: string
  source: string
  /** 学习评价内容，空字符串表示尚未评价 */
  evaluation: string
  /** 最近一次评价保存时间（YYYY.MM.DD），未评价为空 */
  evaluatedAt: string
  /** 待评价起始时间（YYYY.MM.DD）：学员完成学习节点、进入待评价队列的时间 */
  evalPendingSince: string
}

export type PendingGrading = {
  name: string
  learner: string
  submitted: string
  subjective: number
}

export type MarkedPaper = {
  name: string
  learner: string
  score: number
  markedAt: string
  paperName?: string
  /** 该试卷设定的及格线（分），阅卷时写入，用于看板通过率计算 */
  pass?: number
}

/* ---------- 管理端 Blocks（学习包） ---------- */

export type BlockKind = '课程' | '练习题' | '试卷'
export type AdminBlockItem = { title: string; kind: BlockKind; department?: string }
export type AdminBlockTarget = { name: string; department: string; status: '成功' | '失败'; reason: string }
export type AdminPushRecord = { id: number; target: string; deadline: string; pushedAt: string; targets: AdminBlockTarget[] }
export type AdminBlock = {
  name: string
  department: string
  description: string
  items: AdminBlockItem[]
  pushedLearners: { name: string; department: string; deadline: string }[]
  pushRecords: AdminPushRecord[]
  /** 创建日期（YYYY.MM.DD），用于看板"本月新增 Blocks"统计 */
  createdAt: string
}

/** 判断某个 YYYY.MM.DD 日期是否属于当月 */
export function isThisMonth(date: string): boolean {
  if (!date) return false
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return date.startsWith(`${now.getFullYear()}.${p(now.getMonth() + 1)}`)
}

/** 评价超时提醒阈值（天） */
export const EVAL_REMIND_DAYS = 3

/** 今天的日期字符串（YYYY.MM.DD） */
export function todayStr(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

/** 距离某个 YYYY.MM.DD 过去了几天 */
export function daysSince(date: string): number {
  if (!date) return 0
  const [y = 0, m = 1, d = 1] = date.split('.').map(Number)
  const then = new Date(y, m - 1, d).getTime()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.floor((today - then) / 86400000)
}

export const useAdminStore = defineStore('admin', {
  state: () => ({
    students: [
      { name: 'Bling', phone: '13800001111', email: 'bling@ford.com', department: '中后台', role: '人力总监', workId: 'HR001', joined: '2020.06.18', completed: '6/8', progress: '75%', status: '已关闭', password: '', source: '手动添加', evaluation: '', evaluatedAt: '', evalPendingSince: todayStr() },
      { name: 'Tommy', phone: '13800002222', email: 'tommy@ford.com', department: '业务部', role: '业务总监', workId: 'BD001', joined: '2022.03.12', completed: '12/15', progress: '80%', status: '已开通', password: '', source: '手动添加', evaluation: '学习主动性强，业务流程掌握扎实，建议加强客户沟通技巧。', evaluatedAt: '2026.08.20', evalPendingSince: '' },
      { name: 'Farry', phone: '13800003333', email: 'farry@ford.com', department: '客服部', role: '文件支持', workId: 'CS001', joined: '2023.05.20', completed: '5/10', progress: '50%', status: '已关闭', password: '', source: '手动添加', evaluation: '', evaluatedAt: '', evalPendingSince: '2026.08.26' },
      { name: 'Vikki', phone: '13800004444', email: 'vikki@ford.com', department: '产品部', role: '产品经理', workId: 'PD001', joined: '2021.08.01', completed: '18/20', progress: '90%', status: '已关闭', password: '', source: '手动添加', evaluation: '', evaluatedAt: '', evalPendingSince: '2026.08.30' },
      { name: 'Selina', phone: '13800005555', email: 'selina@ford.com', department: '业务部', role: '客户经理', workId: 'BD002', joined: '2024.11.16', completed: '8/12', progress: '67%', status: '已开通', password: '', source: '手动添加', evaluation: '课程完成情况良好。', evaluatedAt: '2026.08.29', evalPendingSince: '' },
      { name: 'Solar', phone: '13800006666', email: 'solar@ford.com', department: '商务部', role: '商务专员', workId: 'CM001', joined: '2023.09.08', completed: '7/12', progress: '58%', status: '已开通', password: '', source: '手动添加', evaluation: '', evaluatedAt: '', evalPendingSince: todayStr() },
      { name: 'Lily', phone: '13800007777', email: 'lily@ford.com', department: '客服部', role: '客服专员', workId: 'CS002', joined: '2025.01.15', completed: '3/10', progress: '30%', status: '已开通', password: '', source: '手动添加', evaluation: '', evaluatedAt: '', evalPendingSince: '2026.08.25' },
    ] as AdminStudent[],
    pendingGradings: [
      { name: '业务知识季度考核', learner: 'Tommy', submitted: '2026.08.26', subjective: 2 },
      { name: '客服岗位能力测评', learner: 'Farry', submitted: '2026.08.25', subjective: 1 },
    ] as PendingGrading[],
    markedPapers: [
      { name: '新人入职综合考核', learner: 'Selina', score: 92, markedAt: '2026.08.22', paperName: '新人入职综合考核', pass: 60 },
      { name: '规章制度专项测试', learner: 'Bling', score: 66, markedAt: '2026.08.20', paperName: '规章制度专项测试', pass: 70 },
    ] as MarkedPaper[],
    adminBlocks: [
      {
        name: '新人业务岗 30 天培训计划',
        department: '业务部',
        description: '面向业务新人的完整入职学习包。',
        items: [
          { title: '企业文化入门', kind: '课程' },
          { title: '业务流程规范 - 章节测试', kind: '练习题' },
        ],
        pushedLearners: [],
        pushRecords: [],
        createdAt: '2026.08.18',
      },
      {
        name: '客服岗服务能力提升包',
        department: '客服部',
        description: '覆盖服务标准与岗位实战能力。',
        items: [
          { title: '客户服务标准', kind: '课程' },
          { title: '新人入职综合考核', kind: '试卷' },
        ],
        pushedLearners: [
          { name: 'Farry', department: '客服部', deadline: '2026.09.30' },
          { name: 'Lily', department: '客服部', deadline: '2026.09.30' },
        ],
        pushRecords: [{ id: 1, target: '客服部', deadline: '2026.09.30', pushedAt: '2026.08.27 10:30', targets: [{ name: 'Farry', department: '客服部', status: '成功', reason: '已送达企业微信，等待学员完成' }, { name: 'Lily', department: '客服部', status: '成功', reason: '已送达企业微信，等待学员完成' }] }],
        createdAt: '2026.08.27',
      },
    ] as AdminBlock[],
  }),

  getters: {
    /** 待阅卷数量 */
    pendingGradingCount(state): number {
      return state.pendingGradings.length
    },
    /** 待评价学员：还没有填写学习评价的 */
    pendingEvaluation(state): AdminStudent[] {
      return state.students.filter((s) => !s.evaluation.trim())
    },
    /** 逾期未评价：超过 EVAL_REMIND_DAYS 天仍未填写 */
    overdueEvaluation(): AdminStudent[] {
      return this.pendingEvaluation.filter((s) => daysSince(s.evalPendingSince) >= EVAL_REMIND_DAYS)
    },
    /** 本月新录入学员（joined 落在当月） */
    newStudentsThisMonth(): AdminStudent[] {
      return this.students.filter((s) => isThisMonth(s.joined))
    },
    /** 本月新建 Blocks */
    newBlocksThisMonth(): AdminBlock[] {
      return this.adminBlocks.filter((b) => isThisMonth(b.createdAt))
    },
    /** 考试通过率：已阅卷中得分 ≥ 该卷及格线的份数占比 */
    passRate(): { rate: number; passed: number; total: number } {
      const total = this.markedPapers.length
      if (!total) return { rate: 0, passed: 0, total: 0 }
      const passed = this.markedPapers.filter((m) => m.score >= (m.pass ?? 60)).length
      return { rate: Math.round((passed / total) * 100), passed, total }
    },
  },

  actions: {
    addStudent(student: AdminStudent) {
      this.students.unshift(student)
    },
    removeStudent(student: AdminStudent) {
      this.students = this.students.filter((item) => item !== student)
    },
    saveEvaluation(name: string, text: string) {
      const student = this.students.find((item) => item.name === name)
      if (!student) return
      student.evaluation = text
      student.evaluatedAt = text.trim() ? todayStr() : ''
      if (text.trim()) student.evalPendingSince = ''
    },
    /** 试卷阅卷完成：从待阅卷移入已阅，记录该卷及格线 */
    finishGrading(pending: PendingGrading, score: number, pass?: number) {
      this.markedPapers.unshift({
        name: pending.name,
        learner: pending.learner,
        score,
        markedAt: todayStr(),
        paperName: pending.name,
        pass,
      })
      this.pendingGradings = this.pendingGradings.filter((p) => p !== pending)
    },
    /** 新建 Blocks（管理端），自动记录创建日期 */
    createAdminBlock(data: { name: string; department: string; description: string; items: AdminBlockItem[] }) {
      this.adminBlocks.unshift({
        ...data,
        pushedLearners: [],
        pushRecords: [],
        createdAt: todayStr(),
      })
    },
    removeAdminBlock(block: AdminBlock) {
      this.adminBlocks = this.adminBlocks.filter((item) => item !== block)
    },
  },
})
