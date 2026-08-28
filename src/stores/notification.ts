import { defineStore } from 'pinia'
import { ref } from 'vue'

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
  /** 是否已读（演示用，先不展开） */
  read: boolean
}

/** 默认一批已存在消息 + 学员会在哪些事件里再追加 */
const initial: NotificationItem[] = [
  {
    id: 'n1',
    kind: '指派',
    title: '新的 Blocks 学习指派',
    body: '培训管理员为你指派了「新人业务岗 30 天培训计划」，请本周内完成。',
    time: '今天 09:20',
    read: false,
  },
  {
    id: 'n2',
    kind: '考试',
    title: 'Q2 服务标准复盘已完成阅卷',
    body: '你提交的「Q2 服务标准复盘」已阅卷，得分 86 分，通过。',
    time: '昨天 16:40',
    read: false,
  },
  {
    id: 'n3',
    kind: '学习',
    title: '本周有 2 项学习任务即将到期',
    body: '「商务谈判技巧」「新人业务岗 30 天培训计划」将于本周日截止。',
    time: '08.22',
    read: true,
  },
  {
    id: 'n4',
    kind: '系统',
    title: '你的岗位层级已更新',
    body: '管理员已将你的岗位层级由「新人期」调整为「成长期」。',
    time: '08.15',
    read: true,
  },
]

export const useNotificationStore = defineStore('notification', () => {
  const items = ref<NotificationItem[]>([...initial])
  const unreadCount = ref(items.value.filter((it) => !it.read).length)

  /** 追加一条新消息（学完、考试出分、被指派等都走这里） */
  function push(payload: {
    kind: NotificationKind
    title: string
    body: string
    time?: string
  }) {
    const id = 'n' + Date.now()
    items.value.unshift({
      id,
      kind: payload.kind,
      title: payload.title,
      body: payload.body,
      time: payload.time ?? '刚刚',
      read: false,
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
