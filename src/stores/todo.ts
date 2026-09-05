import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type TodoSourceType = 'course' | 'block' | 'assignment'
export type TodoState = '未开始' | '进行中' | '已完成'
export type TodoType = '课程' | 'Blocks' | '试卷' | '训练'

export interface TodoItem {
  /** 待学项唯一 id（自增） */
  id: string
  /** 来源类型：用户加入的课程 / 用户加入的 Blocks / 管理员指派 */
  sourceType: TodoSourceType
  /** 关联的原始 id（course id 或 block title） */
  sourceId: string
  /** 标题 */
  title: string
  /** 副标题，例如"课程 · 35 分钟" */
  meta: string
  /** 类型徽标 */
  type: TodoType
  /** 截止时间文案 */
  due: string
  /** 状态 */
  state: TodoState
  /** 学习进度 0-100 */
  progress: number
  /** 左侧色块的颜色（按分类） */
  coverColor: string
}

const initialTodos: TodoItem[] = [
  {
    id: 't4',
    // 管理员推送的考试试卷：sourceId 对应 stores/paper.ts 里的试卷 pe1
    sourceType: 'assignment',
    sourceId: 'pe1',
    title: '新人入职综合考核',
    meta: '试卷 · 8 题 · 满分 100 · 60 分钟',
    type: '试卷',
    due: '2026.09.15 截止',
    state: '未开始',
    progress: 0,
    coverColor: '#b45309',
  },
  {
    id: 't2',
    sourceType: 'course',
    sourceId: 'c6',
    title: '商务谈判技巧',
    meta: '课程 · 75 分钟',
    type: '课程',
    due: '明天到期',
    state: '未开始',
    progress: 0,
    coverColor: '#534ab7',
  },
  {
    id: 't3',
    sourceType: 'block',
    sourceId: 'b1',
    title: '新人业务岗 30 天培训计划',
    meta: 'Blocks · 2 门课程 · 1 项测练',
    type: 'Blocks',
    due: '2026.08.28',
    state: '未开始',
    progress: 0,
    coverColor: '#185fa5',
  },
]

export const useTodoStore = defineStore('todo', () => {
  const items = ref<TodoItem[]>([...initialTodos])

  /** 未完成数量（侧栏角标 + 待学页顶部都用它，保持一处计算） */
  const unfinishedCount = computed(
    () => items.value.filter((it) => it.state !== '已完成').length,
  )

  /**
   * 把课程或 Blocks 加入待学。
   * 同一来源只能加一次，重复时返回 false。
   */
  function addTodo(payload: {
    sourceType: TodoSourceType
    sourceId: string
    title: string
    meta: string
    type: TodoType
    coverColor: string
  }): boolean {
    const exists = items.value.some(
      (it) => it.sourceType === payload.sourceType && it.sourceId === payload.sourceId,
    )
    if (exists) return false
    const id = 't' + Date.now()
    items.value.unshift({
      id,
      sourceType: payload.sourceType,
      sourceId: payload.sourceId,
      title: payload.title,
      meta: payload.meta,
      type: payload.type,
      due: '暂无截止',
      state: '未开始',
      progress: 0,
      coverColor: payload.coverColor,
    })
    return true
  }

  function removeTodo(id: string) {
    items.value = items.value.filter((it) => it.id !== id)
  }

  /** 按来源移除（学完后从待学列表清掉，课程学完 / Blocks 学完都走这里） */
  function removeBySource(sourceType: TodoSourceType, sourceId: string) {
    items.value = items.value.filter(
      (it) => !(it.sourceType === sourceType && it.sourceId === sourceId),
    )
  }

  /** 判断某个来源是否已在待学里 */
  function hasTodo(sourceType: TodoSourceType, sourceId: string) {
    return items.value.some(
      (it) => it.sourceType === sourceType && it.sourceId === sourceId,
    )
  }

  return { items, unfinishedCount, addTodo, removeTodo, removeBySource, hasTodo }
})