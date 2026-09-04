import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 学员端收到的考试试卷（管理员推送 / Blocks 内考核 / 关联课程的随堂测）。
 * 只放"考试"——需要计分、计时、交卷的卷子。
 * Phase 4 接后端后：questions 换成接口返回，交卷调 submit 接口拿判分结果。
 */

export type PaperQuestionType = '单选题' | '多选题' | '判断题' | '简答题'

export interface PaperQuestion {
  id: string
  type: PaperQuestionType
  /** 题干 */
  title: string
  /** 单选题 / 多选题选项（不带 A. B. 前缀）；判断题固定为 正确/错误，无需提供 */
  options?: string[]
  /** 每题分值 */
  score: number
  /** 标准答案：单选 'A'；多选字母串如 'ACD'；判断题 '正确' / '错误' */
  correct: string
  /** 解析 */
  analysis: string
}

export interface Paper {
  id: string
  name: string
  /** 来源说明：管理员指派 / 关联课程 / Blocks 内考核 */
  source: string
  /** 关联课程 */
  course: string
  description: string
  /** 考试时长（分钟） */
  duration: number
  /** 及格分 */
  pass: number
  /** 截止时间文案 */
  deadline?: string
  questions: PaperQuestion[]
}

/** 按字母序号给选项编号：0 -> A */
export function optionLetters(count: number) {
  return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i))
}

export interface PaperOption {
  key: string
  text: string
}

/** 题目选项转成 [{ key, text }]，判断题固定为 正确/错误 */
export function questionOptions(q: PaperQuestion): PaperOption[] {
  if (q.type === '判断题') {
    return [
      { key: '正确', text: '正确' },
      { key: '错误', text: '错误' },
    ]
  }
  const texts = q.options ?? []
  return texts.map((text, i) => ({ key: String.fromCharCode(65 + i), text }))
}

/** 判分用的标准答案 key：单选/多选是字母串，判断题是 正确/错误 */
export function isAnswerCorrect(q: PaperQuestion, my: string): boolean {
  if (!my) return false
  if (q.type === '判断题') return my === q.correct
  return my.split('').sort().join('') === q.correct.split('').sort().join('')
}

const seedPapers: Paper[] = [
  {
    id: 'pe1',
    name: '新人入职综合考核',
    source: '管理员指派',
    course: '全员通用',
    description: '覆盖企业文化、规章制度、业务规范与客户服务基础，检验入职必修内容掌握情况。',
    duration: 60,
    pass: 60,
    deadline: '2026.09.15',
    questions: [
      {
        id: 'pe1q1',
        type: '单选题',
        title: '公司核心价值观中，排在第一位的是？',
        options: ['把客户价值放在第一位', '把利润增长放在第一位', '把管理要求放在第一位', '把个人业绩放在第一位'],
        score: 10,
        correct: 'A',
        analysis: '核心价值观第一条就是"客户为先"，日常考核与经营决策都围绕客户价值展开。',
      },
      {
        id: 'pe1q2',
        type: '单选题',
        title: '新员工须在入职后多久内完成"企业文化入门"必修课？',
        options: ['入职后 7 天内', '入职后 30 天内', '入职后 60 天内', '无硬性时限'],
        score: 10,
        correct: 'B',
        analysis: '新人 30 天培养期内须完成企业文化必修课，未完成将影响转正流程。',
      },
      {
        id: 'pe1q3',
        type: '单选题',
        title: '超过 10 万元的合同，审批权在哪一级？',
        options: ['部门负责人', '分管领导', '总经理', '任意两人会签'],
        score: 10,
        correct: 'B',
        analysis: '按业务流程规范，超过 10 万的合同需提交分管领导审批；10 万以内由部门负责人审批。',
      },
      {
        id: 'pe1q4',
        type: '单选题',
        title: '考勤规则中，工作时间外出办事需要？',
        options: ['口头告知即可', '提前在系统提交外出申请', '事后补说明即可', '无需申请'],
        score: 10,
        correct: 'B',
        analysis: '考勤制度要求外出 / 离岗提前在系统提交申请，未按时归岗按离岗处理。',
      },
      {
        id: 'pe1q5',
        type: '多选题',
        title: '以下哪些属于员工行为红线？',
        options: ['泄露客户资料', '虚报差旅费用', '工作时间偶尔刷手机', '私自收受供应商贵重礼品'],
        score: 15,
        correct: 'ABD',
        analysis: '红线清单集中在数据安全、财务诚信与廉洁要求三项；刷手机按部门管理制度处理，不属于公司级红线。',
      },
      {
        id: 'pe1q6',
        type: '多选题',
        title: '处理客户投诉时，正确的做法包括？',
        options: ['先安抚情绪并倾听', '先解释公司政策', '如实记录客户诉求', '告知明确的处理时限'],
        score: 15,
        correct: 'ACD',
        analysis: '先处理心情再处理事情，急于解释政策反而容易激化情绪；承诺的时限必须兑现。',
      },
      {
        id: 'pe1q7',
        type: '判断题',
        title: 'VIP 客户投诉须在 24 小时内完成首次响应。',
        score: 15,
        correct: '正确',
        analysis: '按现行服务标准，投诉首次响应时限统一为 24 小时，VIP 客户在此基础上可再升级加急。',
      },
      {
        id: 'pe1q8',
        type: '判断题',
        title: '培训考核未通过时，可于次月申请一次免费补考。',
        score: 15,
        correct: '正确',
        analysis: '补考机制为每月一次，须在补考名单确认前主动提出申请，逾期视为放弃当次补考。',
      },
    ],
  },
]

export const usePaperStore = defineStore('paper', () => {
  const papers = ref<Paper[]>([...seedPapers])

  /** 按 id 找试卷 */
  function findPaper(id: string) {
    return papers.value.find((p) => p.id === id)
  }

  /** 卷面总分 = 各题分值之和 */
  function scoreOf(paper: Paper) {
    return paper.questions.reduce((sum, q) => sum + q.score, 0)
  }

  /** 各题型的题目构成（用于说明页展示） */
  function compose(paper: Paper) {
    const map = new Map<string, { count: number; points: number }>()
    paper.questions.forEach((q) => {
      const cur = map.get(q.type) ?? { count: 0, points: 0 }
      cur.count += 1
      cur.points += q.score
      map.set(q.type, cur)
    })
    return Array.from(map.entries()).map(([type, info]) => ({ type, ...info }))
  }

  return { papers, findPaper, scoreOf, compose }
})
