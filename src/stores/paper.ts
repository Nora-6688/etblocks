import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 学员端收到的试卷 / 练习卷（管理员推送 / Blocks 内测练 / 关联课程的随堂练习）。
 * 每一份卷子带真实题目，说明页、答题页、判分都从这份数据来。
 * Phase 4 接后端后：questions 换成接口返回，交卷调 submit 接口拿判分结果。
 */

export type PaperKind = '考试试卷' | '练习题'
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
  kind: PaperKind
  /** 来源说明：管理员指派 / 关联课程 / Blocks 内测练 */
  source: string
  /** 关联课程 */
  course: string
  description: string
  /** 考试时长（分钟） */
  duration: number
  /** 及格分；练习题可省略 */
  pass?: number
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
    kind: '考试试卷',
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
  {
    id: 'pp1',
    name: '客户需求洞察 · 随堂练习',
    kind: '练习题',
    source: '关联课程',
    course: '客户服务标准',
    description: '上完《客户服务标准》第 3 节后的随堂练习，训练需求倾听与提问技巧。',
    duration: 20,
    deadline: '2026.09.30',
    questions: [
      {
        id: 'pp1q1',
        type: '单选题',
        title: '客户抱怨"你们处理得太慢了"，你首先应该？',
        options: ['解释处理流程本来就耗时', '表达理解并向客户致歉', '把责任推给其他环节', '建议客户下次提前预约'],
        score: 20,
        correct: 'B',
        analysis: '先接住情绪——表达理解与歉意，再同步处理进度和可预期的时限，而不是先辩解。',
      },
      {
        id: 'pp1q2',
        type: '单选题',
        title: '挖掘客户真实需求时，更适合采用哪种提问方式？',
        options: ['连续封闭式提问', '开放式提问并追问细节', '一次性把所有问题问完', '凭经验直接给方案'],
        score: 20,
        correct: 'B',
        analysis: '封闭式连环问容易把客户带偏；开放式提问 + 关键细节追问才能摸清真实诉求。',
      },
      {
        id: 'pp1q3',
        type: '多选题',
        title: '以下哪些信号说明客户可能对价格比较敏感？',
        options: ['反复询问有没有优惠', '主动对比竞品报价', '询问付款周期与方式', '当场签单不再议价'],
        score: 20,
        correct: 'ABC',
        analysis: '频繁问优惠、对比竞品、关心付款周期都是价格敏感信号；当场签单说明价格顾虑已解除。',
      },
      {
        id: 'pp1q4',
        type: '判断题',
        title: '记录客户需求时，应尽量使用客户原话，不做主观改写。',
        score: 20,
        correct: '正确',
        analysis: '客户原话最接近真实意图，主观润色容易丢失关键信息，复盘时难以还原需求。',
      },
      {
        id: 'pp1q5',
        type: '判断题',
        title: '客户明确拒绝后，不应再尝试任何形式的挽留或跟进。',
        score: 20,
        correct: '错误',
        analysis: '"暂不需要"和"永远不需要"要区分开；合规前提下可与客户约定后续跟进节点，避免死缠烂打。',
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
