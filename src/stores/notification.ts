import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useTodoStore } from './todo'
import { useHistoryStore } from './history'

export type NotificationKind = '指派' | '考试' | '学习' | '系统'

export interface NotificationItem {
  id: string
  /** 通知类型 */
  kind: NotificationKind
  /** 标题 */
  title: string
  /** 详情描述 */
  body: string
  /** 相对/绝对时间文案 */
  time: string
  /** 是否已读 */
  read: boolean
  /**
   * 消息来源页路由：点击消息 = 标已读 + 跳到来源。
   * 后端接口接入后，这里对应后端返回的 target/source 字段。
   */
  link?: string
}

/**
 * 初始消息不再写死假数据，而是从真实 store 数据推导：
 *  - todo 里管理员指派的项        → 指派消息（跳 /todo）
 *  - history.examRecords          → 考试消息：已阅卷的出分提醒（跳 /training?tab=考试试卷）
 *  - history.blockFinishes        → 学习消息：Blocks 完成（跳 /block/:id）
 *  - history.courseFinishes       → 学习消息：课程完成（跳 /course/:id）
 * 运行期新事件（学完、出分、被指派）通过 push() 追加。
 */
function buildInitialFromStores(): NotificationItem[] {
  const todoStore = useTodoStore()
  const historyStore = useHistoryStore()
  const list: NotificationItem[] = []

  // ① 管理员指派（未完成的排最前，未读）
  todoStore.items
    .filter((it) => it.sourceType === 'assignment' && it.state !== '已完成')
    .forEach((it) => {
      list.push({
        id: `seed-todo-${it.id}`,
        kind: '指派',
        title: `新任务指派：${it.title}`,
        body: `管理员指派了这项任务（${it.meta}），${it.due}。`,
        time: '今天',
        read: false,
        link: '/todo',
      })
    })

  // ② 历史考试 → 阅卷状态提醒（按提交时间倒序；最新一条未读）
  historyStore.examRecords
    .slice()
    .sort((a, b) => (a.finishedAt < b.finishedAt ? 1 : -1))
    .forEach((e, idx) => {
      const graded = e.score !== '待批阅'
      list.push({
        id: `seed-exam-${e.id}`,
        kind: '考试',
        title: graded ? `「${e.examName}」已完成阅卷` : `「${e.examName}」已提交，等待阅卷`,
        body: graded
          ? `得分 ${e.score} 分，${e.pass === true ? '恭喜通过 🎉' : '未通过，可到错题本查看解析'}。`
          : '阅卷完成后会再次提醒你。',
        time: e.finishedAt,
        read: !(idx === 0 || !graded),
        link: '/training?tab=考试试卷',
      })
    })

  // ③ 已完成的 Blocks
  historyStore.blockFinishes.forEach((b) => {
    list.push({
      id: `seed-block-${b.id}`,
      kind: '学习',
      title: `已完成 Blocks《${b.blockTitle}》`,
      body: `共完成 ${b.covered}/${b.total} 项内容，学习路径已标记为已完成。`,
      time: b.finishedAt,
      read: true,
      link: `/block/${b.blockId}`,
    })
  })

  // ④ 已完成的课程（历史课程，默认已读）
  historyStore.courseFinishes.forEach((c) => {
    list.push({
      id: `seed-course-${c.id}`,
      kind: '学习',
      title: `已学完《${c.courseName}》`,
      body: `学习时长 ${c.duration}，已归档到学习记录。`,
      time: c.finishedAt,
      read: true,
      link: `/course/${c.courseId}`,
    })
  })

  return list
}

export const useNotificationStore = defineStore('notification', () => {
  const items = ref<NotificationItem[]>(buildInitialFromStores())
  const unreadCount = ref(items.value.filter((it) => !it.read).length)

  /** 追加一条新消息（学完、考试出分、被指派等都走这里），可带来源跳转路由 */
  function push(payload: {
    kind: NotificationKind
    title: string
    body: string
    time?: string
    /** 点击消息要跳去的来源页路由 */
    link?: string
  }) {
    const id = 'n' + Date.now()
    items.value.unshift({
      id,
      kind: payload.kind,
      title: payload.title,
      body: payload.body,
      time: payload.time ?? '刚刚',
      read: false,
      link: payload.link,
    })
    unreadCount.value = items.value.filter((it) => !it.read).length
    return id
  }

  function markRead(id: string) {
    const it = items.value.find((x) => x.id === id)
    if (it && !it.read) {
      it.read = true
      unreadCount.value = items.value.filter((x) => !x.read).length
    }
  }
  function markAllRead() {
    items.value.forEach((it) => (it.read = true))
    unreadCount.value = 0
  }

  return { items, unreadCount, push, markRead, markAllRead }
})
