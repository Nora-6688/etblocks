import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useTodoStore, type TodoItem } from './todo'

/**
 * 学习历史 / 路径状态。
 * 与 todo store 的关系：
 *  - todo 里 state !== '已完成' 的算"在学"
 *  - 这里 finishCourse / finishBlock 时，往 history 推一条，同时从 todo 移除
 *  - 历史考试 exam history 是平行的一条线（学员端做完一次考试就会留一条）
 */

export interface CourseFinish {
  id: string
  courseId: string
  courseName: string
  /** 关联的学习来源：'todo'（待学进来的）或 'block:xxx'（Block 内学完） */
  source: string
  /** 学完时间 yyyy.MM.dd hh:mm */
  finishedAt: string
  /** 学时（来自课程时长，简单保留） */
  duration: string
}

export interface BlockFinish {
  id: string
  blockId: string
  blockTitle: string
  finishedAt: string
  /** 完成时该 block 包已学过的课程数 / 总课程数 */
  covered: number
  total: number
}

export interface ExamRecord {
  id: string
  examName: string
  /** 提交时间 */
  finishedAt: string
  /** 得分（百分制；问答题可能给"待批阅"占位） */
  score: number | '待批阅'
  /** 是否通过 */
  pass: boolean | '待批阅'
  /** 用时（分钟） */
  usedMinutes: number
  /** 关联试卷 ID（可在个人中心跳回补考/回顾） */
  paperId?: string
  /** 试卷满分 */
  totalScore?: number
  /** 及格线（无及格线的卷不存） */
  passScore?: number
  /** 总题数 */
  questionCount?: number
  /** 答对题数 */
  correctCount?: number
}

/**
 * 已完成的练习（管理员指派 / 关联课程随堂练习）。
 * 练习无评分、不计时，answers 记录每题的作答（选择题=选项字母串，思考题=文本）。
 */
export interface PracticeFinish {
  id: string
  practiceId: string
  practiceName: string
  /** 关联课程 */
  course: string
  finishedAt: string
  /** 学员作答：questionId → 作答内容 */
  answers: Record<string, string>
}

const seedCourses: CourseFinish[] = [
  {
    id: 'cf1',
    courseId: 'c2',
    courseName: '业务流程规范',
    source: 'todo',
    finishedAt: '2026.07.30 10:12',
    duration: '30 分钟',
  },
  {
    id: 'cf2',
    courseId: 'c5',
    courseName: '规章制度精讲',
    source: 'todo',
    finishedAt: '2026.08.10 16:48',
    duration: '40 分钟',
  },
  {
    id: 'cf3',
    courseId: 'c1',
    courseName: '企业文化入门',
    source: 'block:b1',
    finishedAt: '2026.08.18 14:20',
    duration: '45 分钟',
  },
]

const seedBlocks: BlockFinish[] = [
  {
    id: 'bf1',
    blockId: 'b3',
    blockTitle: '全员规章制度必修包',
    finishedAt: '2026.08.12 17:00',
    covered: 2,
    total: 2,
  },
]

const seedExams: ExamRecord[] = [
  {
    id: 'ef1',
    examName: 'Q2 服务标准复盘',
    finishedAt: '2026.08.25 15:30',
    score: 86,
    pass: true,
    usedMinutes: 42,
    totalScore: 100,
    passScore: 60,
    questionCount: 10,
    correctCount: 9,
  },
  {
    id: 'ef2',
    examName: '新人综合考核',
    finishedAt: '2026.08.20 11:10',
    score: 72,
    pass: true,
    usedMinutes: 58,
    totalScore: 100,
    passScore: 60,
    questionCount: 8,
    correctCount: 6,
  },
  {
    id: 'ef3',
    examName: '业务流程章节测试',
    finishedAt: '2026.08.27 09:45',
    score: '待批阅',
    pass: '待批阅',
    usedMinutes: 15,
    totalScore: 100,
    passScore: 60,
    questionCount: 12,
  },
]

/** 历史完成的练习：让首次打开测练记录页就有真实数据 */
const seedPractices: PracticeFinish[] = [
  {
    id: 'pf1',
    practiceId: 'pp1',
    practiceName: '客户需求洞察 · 随堂练习',
    course: '客户服务标准',
    finishedAt: '2026.08.22 16:08',
    answers: {
      pp1q1: 'B',
      pp1q2: 'B',
      pp1q3: 'ABC',
      pp1q4: '正确',
      pp1q5: '错误',
    },
  },
]

export const useHistoryStore = defineStore('history', () => {
  const courseFinishes = ref<CourseFinish[]>([...seedCourses])
  const blockFinishes = ref<BlockFinish[]>([...seedBlocks])
  const examRecords = ref<ExamRecord[]>([...seedExams])
  const practiceFinishes = ref<PracticeFinish[]>([...seedPractices])

  // 让 Pinia 注入 todo，避免循环引用——通过函数参数注入
  // 调用处：在 play.vue / block-detail.vue 里 useTodoStore() 后透传过来
  /** 在 play.vue 学完一门课程时调用 */
  function finishCourse(
    payload: { courseId: string; courseName: string; duration: string },
    todoStore?: ReturnType<typeof useTodoStore>,
    source: string = 'todo',
  ) {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const finishedAt = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    courseFinishes.value.unshift({
      id: 'cf' + Date.now(),
      courseId: payload.courseId,
      courseName: payload.courseName,
      source,
      finishedAt,
      duration: payload.duration,
    })
    // 同步从 todo 移除（保持待学列表只展示未完成项）
    todoStore?.removeBySource('course', payload.courseId)
    return finishedAt
  }

  /** 在 block-detail.vue 完成整个 Blocks 时调用 */
  function finishBlock(
    payload: { blockId: string; blockTitle: string; covered: number; total: number },
    todoStore?: ReturnType<typeof useTodoStore>,
  ) {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const finishedAt = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    blockFinishes.value.unshift({
      id: 'bf' + Date.now(),
      blockId: payload.blockId,
      blockTitle: payload.blockTitle,
      finishedAt,
      covered: payload.covered,
      total: payload.total,
    })
    todoStore?.removeBySource('block', payload.blockId)
    return finishedAt
  }

  /** 完成一次考试：往考试记录里加一条，同步从待学移除（管理员指派的试卷） */
  function finishExam(
    payload: {
      examName: string
      score: number | '待批阅'
      pass: boolean | '待批阅'
      usedMinutes: number
      paperId?: string
      totalScore?: number
      passScore?: number
      questionCount?: number
      correctCount?: number
    },
    todoStore?: ReturnType<typeof useTodoStore>,
    paperId?: string,
  ) {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const finishedAt = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    examRecords.value.unshift({
      id: 'ef' + Date.now(),
      examName: payload.examName,
      finishedAt,
      score: payload.score,
      pass: payload.pass,
      usedMinutes: payload.usedMinutes,
      paperId: payload.paperId ?? paperId,
      totalScore: payload.totalScore,
      passScore: payload.passScore,
      questionCount: payload.questionCount,
      correctCount: payload.correctCount,
    })
    // 试卷是从"待学"点进来的：交卷后把这一项清掉
    if (paperId) todoStore?.removeBySource('assignment', paperId)
    return finishedAt
  }

  /** 完成一次练习：写入历史并从待学移除（练习无评分，answers 是必填） */
  function finishPractice(
    payload: {
      practiceId: string
      practiceName: string
      course: string
      answers: Record<string, string>
    },
    todoStore?: ReturnType<typeof useTodoStore>,
  ) {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const finishedAt = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    practiceFinishes.value.unshift({
      id: 'pf' + Date.now(),
      practiceId: payload.practiceId,
      practiceName: payload.practiceName,
      course: payload.course,
      finishedAt,
      answers: { ...payload.answers },
    })
    todoStore?.removeBySource('assignment', payload.practiceId)
    return finishedAt
  }

  /** 学习路径状态：综合待学 + 历史 */
  function pathStatus(
    blockId: string,
    blockTitle: string,
    todoStore: ReturnType<typeof useTodoStore>,
  ): {
    state: '未生成' | '曾经学习' | '正在学习' | '已完成'
    todoItem?: TodoItem
  } {
    // 已完成（最新一次）排在最前
    const latestFinish = blockFinishes.value
      .filter((b) => b.blockId === blockId)
      .sort((a, b) => (a.finishedAt < b.finishedAt ? 1 : -1))[0]
    // 当前是否在学习（todo 里还有这个 block）
    const todoItem = todoStore.items.find(
      (it) => it.sourceType === 'block' && it.sourceId === blockId,
    )
    if (latestFinish && (!todoItem || todoItem.progress === 100)) {
      return { state: '已完成', todoItem }
    }
    if (todoItem) return { state: '正在学习', todoItem }
    if (latestFinish) return { state: '曾经学习', todoItem }
    return { state: '未生成' }
  }

  const stats = computed(() => ({
    finishedCourses: courseFinishes.value.length,
    finishedBlocks: blockFinishes.value.length,
    finishedPractices: practiceFinishes.value.length,
    examsDone: examRecords.value.filter((e) => e.score !== '待批阅').length,
    examsPending: examRecords.value.filter((e) => e.score === '待批阅').length,
  }))

  return {
    courseFinishes,
    blockFinishes,
    examRecords,
    practiceFinishes,
    stats,
    finishCourse,
    finishBlock,
    finishExam,
    finishPractice,
    pathStatus,
  }
})
