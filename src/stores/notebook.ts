import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 错题附图（dataURL 存储便于预览，后续接后端时换成文件服务 URL） */
export interface WrongImage {
  id: string
  name: string
  url: string
}

export type WrongQuestionType = '单选题' | '多选题' | '判断题' | '简答题'

export interface WrongQuestion {
  id: string
  /** 题干 */
  title: string
  /** 题型 */
  type: WrongQuestionType
  /** 关联课程 */
  course: string
  /** 我当时的答案 */
  myAnswer: string
  /** 正确答案 */
  correctAnswer: string
  /** 解析 / 笔记 */
  analysis: string
  /** 题目截图等图片 */
  images: WrongImage[]
  createdAt: string
  updatedAt: string
}

/** 统一的时间文案 yyyy.MM.dd hh:mm */
export function fmtNow() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

const seedQuestions: WrongQuestion[] = [
  {
    id: 'wq1',
    title: '业务审批流程中，超过 10 万的合同需要谁审批？',
    type: '单选题',
    course: '业务流程规范',
    myAnswer: 'A. 部门负责人',
    correctAnswer: 'B. 分管领导',
    analysis:
      '根据业务流程规范，超过 10 万的合同需提交分管领导审批；10 万以内由部门负责人审批。容易和报销流程搞混。',
    images: [],
    createdAt: '2026.08.20 11:20',
    updatedAt: '2026.08.20 11:20',
  },
  {
    id: 'wq2',
    title: '客户提出投诉时，第一步应该做什么？',
    type: '简答题',
    course: '客户服务标准',
    myAnswer: '先解释公司政策',
    correctAnswer: '先安抚情绪、倾听并记录诉求，再按投诉分级流程处理',
    analysis: '服务标准要求"先处理心情，再处理事情"——第一步永远是安抚与倾听，解释政策反而会激化情绪。',
    images: [],
    createdAt: '2026.08.24 16:05',
    updatedAt: '2026.08.26 09:30',
  },
]

export const useNotebookStore = defineStore('notebook', () => {
  const items = ref<WrongQuestion[]>([...seedQuestions])

  /** 新增一条错题，返回 id */
  function addQuestion(payload: Omit<WrongQuestion, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = fmtNow()
    const q: WrongQuestion = {
      ...payload,
      id: 'wq' + Date.now(),
      createdAt: now,
      updatedAt: now,
    }
    items.value.unshift(q)
    return q.id
  }

  /** 更新一条错题 */
  function updateQuestion(id: string, patch: Partial<WrongQuestion>) {
    const q = items.value.find((x) => x.id === id)
    if (!q) return
    Object.assign(q, patch, { updatedAt: fmtNow() })
  }

  /** 删除一条错题 */
  function removeQuestion(id: string) {
    items.value = items.value.filter((x) => x.id !== id)
  }

  return { items, addQuestion, updateQuestion, removeQuestion }
})
