import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 学员的"练习"数据（区别于"考试"）。
 * 练习不计时、不评分、不交卷；可以是几道客观题，也可以是思考题。
 * 学员点「完成练习」即保存，答案会进入测练记录可回顾。
 * Phase 4 接后端后：questions 由接口返回，submit 走 finish 接口。
 */

export type PracticeQuestionType = '单选题' | '多选题' | '判断题' | '思考题'

export interface PracticeQuestion {
  id: string
  type: PracticeQuestionType
  /** 题干 */
  title: string
  /** 单选/多选题的选项（不带 A. B. 前缀）；判断题固定为 正确/错误，无需提供 */
  options?: string[]
  /** 参考答案：单选 'A'；多选字母串如 'ACD'；判断题 '正确' / '错误'；思考题为参考要点或留空 */
  refAnswer?: string
  /** 解析 / 要点提示（学员回顾时显示） */
  analysis?: string
}

export interface Practice {
  id: string
  name: string
  /** 来源说明：管理员指派 / 关联课程 / Blocks 内测练 */
  source: string
  /** 关联课程 */
  course: string
  /** 练习说明（不是试卷，没有时长/总分/及格线等数字） */
  description: string
  /** 截止时间文案 */
  deadline?: string
  questions: PracticeQuestion[]
}

const seedPractices: Practice[] = [
  {
    id: 'pp1',
    name: '客户需求洞察 · 随堂练习',
    source: '关联课程',
    course: '客户服务标准',
    description: '上完《客户服务标准》第 3 节后的随堂练习，训练需求倾听与提问技巧。',
    deadline: '2026.09.30',
    questions: [
      {
        id: 'pp1q1',
        type: '单选题',
        title: '客户抱怨"你们处理得太慢了"，你首先应该？',
        options: ['解释处理流程本来就耗时', '表达理解并向客户致歉', '把责任推给其他环节', '建议客户下次提前预约'],
        refAnswer: 'B',
        analysis: '先接住情绪——表达理解与歉意，再同步处理进度和可预期的时限，而不是先辩解。',
      },
      {
        id: 'pp1q2',
        type: '单选题',
        title: '挖掘客户真实需求时，更适合采用哪种提问方式？',
        options: ['连续封闭式提问', '开放式提问并追问细节', '一次性把所有问题问完', '凭经验直接给方案'],
        refAnswer: 'B',
        analysis: '封闭式连环问容易把客户带偏；开放式提问 + 关键细节追问才能摸清真实诉求。',
      },
      {
        id: 'pp1q3',
        type: '多选题',
        title: '以下哪些信号说明客户可能对价格比较敏感？',
        options: ['反复询问有没有优惠', '主动对比竞品报价', '询问付款周期与方式', '当场签单不再议价'],
        refAnswer: 'ABC',
        analysis: '频繁问优惠、对比竞品、关心付款周期都是价格敏感信号；当场签单说明价格顾虑已解除。',
      },
      {
        id: 'pp1q4',
        type: '判断题',
        title: '记录客户需求时，应尽量使用客户原话，不做主观改写。',
        refAnswer: '正确',
        analysis: '客户原话最接近真实意图，主观润色容易丢失关键信息，复盘时难以还原需求。',
      },
      {
        id: 'pp1q5',
        type: '判断题',
        title: '客户明确拒绝后，不应再尝试任何形式的挽留或跟进。',
        refAnswer: '错误',
        analysis: '"暂不需要"和"永远不需要"要区分开；合规前提下可与客户约定后续跟进节点，避免死缠烂打。',
      },
    ],
  },
  {
    id: 'pp2',
    name: '客户异议处理 · 思考练习',
    source: '管理员指派',
    course: '销售技巧',
    description: '围绕真实异议场景，整理你的应对思路；没有标准答案，重点是写下来。',
    questions: [
      {
        id: 'pp2q1',
        type: '思考题',
        title: '客户说"我再考虑考虑"，你怎么回应？',
        analysis: '提示：先判断是真犹豫还是礼貌拒绝，再决定是给空间还是补一刀。',
      },
      {
        id: 'pp2q2',
        type: '思考题',
        title: '客户说"价格太贵了"，但你判断他对产品本身感兴趣，怎么破局？',
        analysis: '提示：拆解价格贵在哪、不贵的部分有没有价值、能不能换一种付费方式。',
      },
      {
        id: 'pp2q3',
        type: '思考题',
        title: '客户已使用竞品 3 年，关系很铁，怎么切入？',
        analysis: '提示：不直接否定竞品；找对方没说出口的痛点，用案例和事实建立信任。',
      },
    ],
  },
]

export const usePracticeStore = defineStore('practice', () => {
  const practices = ref<Practice[]>([...seedPractices])

  function findPractice(id: string) {
    return practices.value.find((p) => p.id === id)
  }

  return { practices, findPractice }
})