<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBlockStore } from '@/stores/blocks'
import { useCourseStore } from '@/stores/course'
import { useTodoStore } from '@/stores/todo'
import { useHistoryStore } from '@/stores/history'
import { useNotificationStore } from '@/stores/notification'

const route = useRoute()
const router = useRouter()
const blockStore = useBlockStore()
const courseStore = useCourseStore()
const todoStore = useTodoStore()
const historyStore = useHistoryStore()
const notificationStore = useNotificationStore()

const block = computed(() => blockStore.getBlockById(String(route.params.id)))

interface ContentEntry {
  name: string
  kind: '课程' | '测练'
  courseId?: string
  meta: string
}

/** 把 Blocks 里的每一项解析成"课程"或"测练"，课程关联到真实课程 */
const contents = computed<ContentEntry[]>(() => {
  if (!block.value) return []
  return block.value.contents.map((name) => {
    const c = courseStore.courses.find((x) => x.name === name)
    if (c) return { name, kind: '课程', courseId: c.id, meta: `${c.type} · ${c.duration}` }
    return { name, kind: '测练', meta: '练习 / 试卷' }
  })
})

function openContent(entry: ContentEntry) {
  if (!block.value) return
  if (entry.courseId) {
    // 进入课程首页（详情页），标注来源是哪个 Blocks，方便原路返回
    router.push({
      path: `/course/${entry.courseId}`,
      query: { from: `block:${block.value.id}` },
    })
  } else {
    ElMessage.info(`《${entry.name}》为测练内容，进入答题页将在后续版本开放`)
  }
}

function goBack() {
  router.push('/todo')
}

function finishBlock() {
  if (!block.value) return
  ElMessageBox.confirm(
    `确认已完成《${block.value.title}》的全部学习？完成后将从待学列表移除。`,
    '完成学习',
    {
      confirmButtonText: '确认完成',
      cancelButtonText: '再看看',
      type: 'success',
    },
  )
    .then(() => {
      historyStore.finishBlock(
        {
          blockId: block.value!.id,
          blockTitle: block.value!.title,
          covered: contents.value.length,
          total: contents.value.length,
        },
        todoStore,
      )
      notificationStore.push({
        kind: '学习',
        title: `已完成 Blocks《${block.value!.title}》`,
        body: '学习路径已标记为已完成，点击本条消息可回到该 Blocks。',
        link: `/block/${block.value!.id}`,
      })
      ElMessage.success('Blocks 学习完成，已从待学列表移除')
      router.push('/todo')
    })
    .catch(() => {})
}
</script>

<template>
  <div v-if="block" class="block-detail">
    <div class="detail-nav">
      <button @click="goBack">← 返回待学内容</button>
    </div>
    <div class="detail-header">
      <div class="block-cover" :style="{ background: block.color }">B</div>
      <div class="header-info">
        <div class="tags">
          <em>组合课程 Blocks</em>
          <em>{{ block.role }}</em>
          <em>{{ block.level }}</em>
        </div>
        <h1>{{ block.title }}</h1>
        <p class="desc">{{ block.description }}</p>
        <div class="meta-row">
          <span>内容：{{ block.contents.length }} 项</span>
          <span>组合：{{ block.duration }}</span>
        </div>
        <div class="action-row">
          <el-button type="primary" size="large" @click="finishBlock">✓ 完成全部学习</el-button>
        </div>
      </div>
    </div>
    <div class="tab-bar">
      <button class="active">内容清单</button>
    </div>
    <div class="tab-content">
      <div class="chapter" v-for="(entry, index) in contents" :key="entry.name">
        <i :class="entry.kind === '课程' ? '' : 'quiz'">{{ index + 1 }}</i>
        <div>
          <b>{{ entry.name }}</b>
          <small>{{ entry.kind }} · {{ entry.meta }}</small>
        </div>
        <button
          v-if="entry.kind === '课程'"
          class="play-btn"
          @click="openContent(entry)"
        >开始学习 →</button>
        <button v-else class="quiz-btn" disabled>测练</button>
      </div>
      <p class="finish-tip">逐个完成上方内容后，点击顶部「✓ 完成全部学习」即可从待学列表移除本 Blocks。</p>
    </div>
  </div>
  <div v-else class="not-found">
    <p>该 Blocks 不存在或已下架</p>
    <el-button type="primary" @click="goBack">返回待学内容</el-button>
  </div>
</template>

<style scoped>
.block-detail { max-width: 900px; margin: 0 auto; }
.detail-nav { margin-bottom: 16px; }
.detail-nav button { border: 0; background: transparent; color: var(--teal); cursor: pointer; font-size: 13px; }
.detail-header { display: flex; gap: 24px; background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 24px; margin-bottom: 20px; }
.block-cover { width: 120px; height: 120px; border-radius: 12px; flex-shrink: 0; display: grid; place-items: center; color: #fff; font-size: 40px; font-weight: 800; }
.header-info { flex: 1; }
.tags { display: flex; gap: 6px; margin-bottom: 10px; }
.tags em { padding: 3px 8px; border-radius: 4px; background: var(--mint); color: var(--teal); font-size: 11px; font-style: normal; }
.header-info h1 { font-size: 22px; font-weight: 600; margin-bottom: 8px; }
.desc { color: var(--muted); font-size: 13px; line-height: 1.7; margin-bottom: 14px; }
.meta-row { display: flex; gap: 20px; margin-bottom: 18px; }
.meta-row span { color: var(--muted); font-size: 12px; }
.action-row { display: flex; gap: 10px; }
.tab-bar { display: flex; border-bottom: 1px solid var(--line); margin-bottom: 20px; }
.tab-bar button { padding: 12px 20px; border: 0; border-bottom: 2px solid var(--teal); background: transparent; color: var(--teal); cursor: pointer; font-size: 14px; font-weight: 600; }
.tab-content { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 24px; min-height: 200px; }
.chapter { display: flex; align-items: center; gap: 14px; padding: 14px; border: 1px solid var(--line); border-radius: 8px; margin-bottom: 12px; }
.chapter i { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--mint); color: var(--teal); font-style: normal; font-size: 13px; }
.chapter i.quiz { background: #fff3d6; color: #b45309; }
.chapter > div { flex: 1; }
.chapter b { display: block; font-size: 13px; margin-bottom: 3px; }
.chapter small { color: var(--muted); font-size: 11px; }
.play-btn { border: 0; border-radius: 6px; background: var(--teal); color: #fff; cursor: pointer; font-size: 12px; padding: 8px 14px; }
.quiz-btn { border: 1px solid #e3d5b0; border-radius: 6px; background: #faf6ea; color: #b45309; font-size: 12px; padding: 8px 14px; }
.finish-tip { margin-top: 18px; color: var(--muted); font-size: 12px; }
.not-found { display: grid; place-items: center; gap: 16px; min-height: 300px; }
.not-found p { color: var(--muted); font-size: 14px; }
@media (max-width: 700px) {
  .detail-header { flex-direction: column; }
  .block-cover { width: 100%; height: 110px; }
  .meta-row { flex-wrap: wrap; gap: 10px; }
}
</style>
