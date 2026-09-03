<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useHistoryStore } from '@/stores/history'
import { useTodoStore } from '@/stores/todo'
import { useBlockStore } from '@/stores/blocks'
import { useCourseStore } from '@/stores/course'
import { useNotificationStore } from '@/stores/notification'

const router = useRouter()
const userStore = useUserStore()
const historyStore = useHistoryStore()
const todoStore = useTodoStore()
const blockStore = useBlockStore()
const courseStore = useCourseStore()
const notificationStore = useNotificationStore()

/* ---------- Yoyo 形象：会说话的引言 ---------- */
const yoyoMoods = [
  '嗨，我是 Yoyo 👋 跟我说说你最近的工作卡在哪里？',
  '把岗位 + 工作困难交给我，我帮你拆出能力短板 ✨',
  '学完一节别忘了回来和我打个卡哦～',
]
const yoyoMood = ref(yoyoMoods[0])

/* ---------- AI 问题诊断 ---------- */
const roleOptions = ['业务岗', '客服岗', '商务岗', '产品岗', '职能岗']
const diagnosis = ref({ role: '业务岗', difficulty: '' })
const showDiagnosis = ref(false)
function runDiagnosis() {
  if (!diagnosis.value.difficulty.trim()) {
    ElMessage.warning('描述一下困难，Yoyo 才能帮你诊断～')
    return
  }
  showDiagnosis.value = false
  analysisReady.value = true
  yoyoMood.value = '诊断完成 ✅ 看下面短板分析与推荐课程～'
  ElMessage.success('已为你生成能力短板分析与课程推荐')
}

/* ---------- 我的学习路径：能力短板 ---------- */
/**
 * 能力维度从 blocks 的 contents 关键词里抽取：
 *  - 课程名包含"流程/规章/制度" → 流程规范
 *  - "客户/服务/沟通/谈判" → 沟通与服务
 *  - "产品/行业" → 产品认知
 *  - "企业文化/价值观" → 文化融入
 * 给当前 lesson / learning path 一个分数（0-100）。
 */
const abilityDimensions = computed(() => {
  const doneCourses = new Set(historyStore.courseFinishes.map((c) => c.courseId))
  const totals: Record<string, { name: string; score: number; max: number }> = {
    flow: { name: '流程规范', score: 0, max: 0 },
    comm: { name: '沟通与服务', score: 0, max: 0 },
    product: { name: '产品认知', score: 0, max: 0 },
    culture: { name: '文化融入', score: 0, max: 0 },
  }
  courseStore.courses.forEach((c) => {
    const name = c.name
    const full = 100 // 每门课占 100 分
    let matched: keyof typeof totals | undefined
    if (/流程|规章|制度/.test(name)) matched = 'flow'
    else if (/客户|服务|沟通|谈判/.test(name)) matched = 'comm'
    else if (/产品|行业/.test(name)) matched = 'product'
    else if (/企业|文化|价值观/.test(name)) matched = 'culture'
    if (matched) {
      const total = totals[matched]
      if (!total) return
      total.max += full
      if (doneCourses.has(c.id)) total.score += full
    }
  })
  return Object.values(totals)
    .filter((t) => t.max > 0)
    .map((t) => ({
      name: t.name,
      percent: Math.round((t.score / t.max) * 100),
      weak: (t.score / t.max) * 100 < 60,
    }))
})

/* 找到短板最高的 1-2 个维度 → 推荐课程 */
const weakDims = computed(() => abilityDimensions.value.filter((d) => d.weak))
const recommendedCourses = computed(() => {
  if (!weakDims.value.length) {
    // 没短板的话推荐最新课程兜底
    return courseStore.courses.slice(0, 3)
  }
  const keywords: Record<string, RegExp[]> = {
    流程规范: [/流程/, /规章/, /制度/],
    沟通与服务: [/客户/, /服务/, /沟通/, /谈判/],
    产品认知: [/产品/, /行业/],
    文化融入: [/企业/, /文化/, /价值观/],
  }
  const hits: { courseId: string; weight: number }[] = []
  weakDims.value.forEach((d, idx) => {
    const kws = keywords[d.name] || []
    courseStore.courses.forEach((c) => {
      if (kws.some((re) => re.test(c.name))) {
        hits.push({ courseId: c.id, weight: (weakDims.value.length - idx) * 10 })
      }
    })
  })
  const sorted = hits
    .sort((a, b) => b.weight - a.weight)
    .map((h) => courseStore.getCourseById(h.courseId))
    .filter((course): course is NonNullable<typeof course> => course !== undefined)
  // 去重
  const seen = new Set<string>()
  return sorted.filter((c) => {
    if (!c || seen.has(c.id)) return false
    seen.add(c.id)
    return true
  }).slice(0, 4)
})

const analysisReady = ref(true) // 默认就显示分析；点 AI 诊断后会刷新

/* ---------- UP NEXT：真待学数据 ---------- */
const upNext = computed(() => todoStore.items.filter((it) => it.state !== '已完成').slice(0, 4))

function openTodo() {
  router.push('/todo')
}

function progressColor(coverColor: string) {
  return coverColor
}

/* ---------- 消息通知 ---------- */
const unread = computed(() => notificationStore.unreadCount)
const notices = computed(() => { notificationStore.ensureInit(); return notificationStore.items.slice(0, 4) })
function timeAgoLabel(t: string) {
  // 演示数据已是 "今天 09:20" / "08.22" / "刚刚" 这种文案，原样展示
  return t
}
function noticeKindClass(k: string) {
  return `notice-${k}`
}
function markAllRead() {
  if (unread.value === 0) {
    ElMessage.info('已经没有未读消息了')
    return
  }
  notificationStore.markAllRead()
  ElMessage.success('已全部标为已读')
}
/** 点击消息 = 标已读 + 跳到这条消息的来源页（课程 / Blocks / 待学 / 阅卷结果） */
function openNotice(item: { id: string; link?: string }) {
  notificationStore.markRead(item.id)
  if (item.link) router.push(item.link)
}
</script>

<template>
  <!-- =============== 学习看板 =============== -->
  <section class="board">
    <!-- 顶部欢迎 + 简要数据 -->
    <div class="board-hero">
      <div>
        <p class="eyebrow">LEARNING DASHBOARD</p>
        <h1>学习看板</h1>
        <p class="sub">欢迎回来，{{ userStore.profile.name }} · 以下是你今天的学习概览</p>
      </div>
      <div class="hero-stats">
        <div><b>{{ todoStore.unfinishedCount }}</b><span>待学任务</span></div>
        <div><b>{{ historyStore.stats.finishedCourses }}</b><span>已学课程</span></div>
        <div><b>{{ unread }}</b><span>未读消息</span></div>
      </div>
    </div>

    <!-- ① Yoyo + AI 问题诊断 -->
    <div class="yoyo-card">
      <div class="yoyo-figure">
        <!-- Yoyo AI 助理：圆润、半透亮蓝紫色调，拿着一本打开的"学习手册" -->
        <svg viewBox="0 0 200 220" width="180" height="200" aria-label="Yoyo">
          <defs>
            <radialGradient id="bodyGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#a4c8ff" />
              <stop offset="55%" stop-color="#5a82d8" />
              <stop offset="100%" stop-color="#3a55a5" />
            </radialGradient>
            <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#102a4a" />
              <stop offset="100%" stop-color="#1f4373" />
            </linearGradient>
          </defs>
          <!-- 影子 -->
          <ellipse cx="100" cy="208" rx="55" ry="6" fill="rgba(35,80,140,.18)" />
          <!-- 身体 -->
          <ellipse cx="100" cy="118" rx="62" ry="58" fill="url(#bodyGrad)" />
          <!-- 头顶光晕 -->
          <ellipse cx="100" cy="58" rx="32" ry="10" fill="rgba(255,255,255,.35)" />
          <!-- 屏幕脸 -->
          <rect x="60" y="80" width="80" height="56" rx="14" fill="url(#screenGrad)" />
          <!-- 眼睛 -->
          <circle cx="83" cy="105" r="6" fill="#7adfff" />
          <circle cx="117" cy="105" r="6" fill="#7adfff" />
          <circle cx="83" cy="105" r="2.4" fill="#fff" />
          <circle cx="117" cy="105" r="2.4" fill="#fff" />
          <!-- 微笑嘴 -->
          <path d="M86 122 Q100 132 114 122" stroke="#7adfff" stroke-width="2.5" fill="none" stroke-linecap="round" />
          <!-- 耳朵/天线 -->
          <line x1="60" y1="100" x2="42" y2="92" stroke="#3a55a5" stroke-width="3" stroke-linecap="round" />
          <line x1="140" y1="100" x2="158" y2="92" stroke="#3a55a5" stroke-width="3" stroke-linecap="round" />
          <!-- 耳机 -->
          <rect x="38" y="92" width="10" height="14" rx="3" fill="#1f4373" />
          <rect x="152" y="92" width="10" height="14" rx="3" fill="#1f4373" />
          <!-- 一只手拿着小册子 -->
          <rect x="38" y="146" width="34" height="26" rx="3" fill="#ffffff" stroke="#3a55a5" stroke-width="2" />
          <line x1="42" y1="155" x2="68" y2="155" stroke="#9bb6dc" stroke-width="1.5" />
          <line x1="42" y1="161" x2="68" y2="161" stroke="#9bb6dc" stroke-width="1.5" />
          <line x1="42" y1="167" x2="60" y2="167" stroke="#9bb6dc" stroke-width="1.5" />
          <!-- 另一只手挥手 -->
          <circle cx="148" cy="146" r="9" fill="url(#bodyGrad)" />
          <path d="M148 138 v-12" stroke="#3a55a5" stroke-width="3" stroke-linecap="round" />
          <!-- 胸前 YOYO 标签 -->
          <rect x="84" y="148" width="32" height="14" rx="4" fill="#0f2552" />
          <text x="100" y="158" text-anchor="middle" font-size="9" font-weight="800" fill="#7adfff" font-family="Helvetica, Arial, sans-serif">YOYO</text>
        </svg>
        <p class="yoyo-msg">{{ yoyoMood }}</p>
      </div>

      <div class="yoyo-form">
        <div class="yoyo-head">
          <p class="eyebrow dark-eyebrow">AI · LEARNING ASSISTANT</p>
          <h2>AI 问题诊断</h2>
          <p class="sub">输入你的岗位和工作困难，Yoyo 自动分析能力短板并生成学习路径</p>
        </div>
        <div class="yoyo-fields">
          <label class="field">
            <span>岗位</span>
            <el-select v-model="diagnosis.role" placeholder="选择岗位" style="width: 100%" size="large">
              <el-option v-for="r in roleOptions" :key="r" :label="r" :value="r" />
            </el-select>
          </label>
          <label class="field">
            <span>工作困难（越详细越好）</span>
            <el-input
              v-model="diagnosis.difficulty"
              type="textarea"
              :rows="3"
              resize="none"
              placeholder="例如：客户沟通时难以挖掘真实需求，签单转化率一直上不去"
            />
          </label>
          <div class="yoyo-actions">
            <el-button type="primary" size="large" round @click="runDiagnosis">✦ 开始 AI 诊断</el-button>
            <span class="hint">诊断结果会刷新下方"能力短板分析"</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ② 能力短板分析 + 课程推荐 -->
    <div class="ability-card panel">
      <div class="panel-head">
        <div>
          <p class="eyebrow">ABILITY GAP ANALYSIS</p>
          <h2>能力短板分析</h2>
          <p class="sub">基于你的岗位阶段与已学课程，识别需要补强的能力维度</p>
        </div>
        <a @click.prevent="router.push('/learning')">查看学习列表 →</a>
      </div>

      <div class="ability-row" v-if="analysisReady">
        <div
          v-for="d in abilityDimensions"
          :key="d.name"
          class="ability-bar"
          :class="{ weak: d.weak }"
        >
          <div class="ability-label">
            <strong>{{ d.name }}</strong>
            <b :class="{ low: d.weak }">{{ d.percent }}%</b>
          </div>
          <div class="bar">
            <i :style="{ width: d.percent + '%' }"></i>
          </div>
          <small>{{ d.weak ? '⚠ 建议优先补强' : '✓ 已具备基础' }}</small>
        </div>
      </div>

      <div class="recommend" v-if="recommendedCourses.length">
        <p class="eyebrow small-eyebrow">配套课程推荐</p>
        <div class="rec-grid">
          <div v-for="c in recommendedCourses" :key="c.id" class="rec-card">
            <div class="rec-cover" :style="{ background: '#3a55a5' }">
              {{ c.category.slice(0, 2) }}
            </div>
            <div class="rec-info">
              <small>{{ c.category }} · {{ c.duration }}</small>
              <h4>{{ c.name }}</h4>
              <p>{{ c.description }}</p>
              <el-button size="small" type="primary" link @click="router.push(`/course/${c.id}`)">
                开始学习 →
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ③ UP NEXT + 消息通知 -->
    <div class="lower-grid">
      <div class="panel task-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">UP NEXT</p>
            <h2>接下来要做</h2>
            <p class="sub">展示待学的课程 / Blocks / 试卷，点击跳转到待学内容</p>
          </div>
          <a @click.prevent="openTodo">查看全部 →</a>
        </div>
        <div class="task-list">
          <div
            v-for="t in upNext"
            :key="t.id"
            class="task-item clickable"
            @click="openTodo"
          >
            <span class="task-mark" :style="{ background: progressColor(t.coverColor), color: '#fff' }">
              {{ t.type === '课程' ? '▦' : t.type === 'Blocks' ? '⊞' : '✓' }}
            </span>
            <div class="task-info">
              <strong>{{ t.title }}</strong>
              <small>{{ t.meta }}</small>
            </div>
            <div class="task-meta">
              <span class="due">{{ t.due }}</span>
              <div class="bar" v-if="t.progress > 0">
                <i :style="{ width: t.progress + '%', background: t.coverColor }"></i>
              </div>
            </div>
          </div>
          <div v-if="!upNext.length" class="empty">
            <p>🎉 暂无待学任务，去"学习列表"挑点内容吧～</p>
            <el-button size="small" @click="router.push('/learning')">去学习列表</el-button>
          </div>
        </div>
      </div>

      <div class="panel notice-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">MESSAGES</p>
            <h2>消息通知</h2>
            <p class="sub">{{ unread ? `${unread} 条未读 · ` : '' }}点击消息可跳到来源</p>
          </div>
          <div class="notice-actions">
            <button class="mark-all" @click="markAllRead">全部已读</button>
          </div>
        </div>
        <div class="notice-list">
          <div
            v-for="n in notices"
            :key="n.id"
            class="notice-item"
            :class="{ unread: !n.read }"
            @click="openNotice(n)"
          >
            <span class="kind-tag" :class="noticeKindClass(n.kind)">{{ n.kind }}</span>
            <div class="notice-body">
              <strong>{{ n.title }}</strong>
              <p>{{ n.body }}</p>
              <small>{{ timeAgoLabel(n.time) }}</small>
            </div>
            <span v-if="n.link" class="go-source">查看 →</span>
            <span v-if="!n.read" class="dot"></span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.board {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* 顶部欢迎 */
.board-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
}
.board-hero h1 {
  font-family: Georgia, serif;
  font-size: 32px;
}
.eyebrow {
  color: var(--teal);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.6px;
  margin-bottom: 6px;
}
.dark-eyebrow {
  color: #b9d0ee;
}
.sub {
  color: var(--muted);
  margin-top: 6px;
  font-size: 13px;
}
.hero-stats {
  display: flex;
  gap: 22px;
  padding: 16px 22px;
  background: #fff;
  border: 1px solid var(--line);
}
.hero-stats > div {
  text-align: center;
  min-width: 70px;
}
.hero-stats b {
  display: block;
  font-family: Georgia, serif;
  font-size: 24px;
  color: #1f3a64;
}
.hero-stats span {
  display: block;
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
}

/* ① Yoyo 卡片 */
.yoyo-card {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 0;
  background: linear-gradient(135deg, #1f4373 0%, #2c5e9c 50%, #3f74b3 100%);
  color: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 24px rgba(31, 67, 115, .15);
}
.yoyo-figure {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 18px 14px 14px;
  background: radial-gradient(circle at 50% 60%, rgba(122, 223, 255, .18), transparent 70%);
}
.yoyo-msg {
  margin-top: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .12);
  font-size: 11px;
  text-align: center;
  color: #d6e6ff;
}
.yoyo-form {
  padding: 28px 32px 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.yoyo-form h2 {
  color: #fff;
  font-family: Georgia, serif;
  font-size: 22px;
}
.yoyo-form .sub {
  color: #c0d4ee;
}
.yoyo-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field > span {
  color: #d6e6ff;
  font-size: 12px;
}
.yoyo-fields :deep(.el-select),
.yoyo-fields :deep(.el-textarea) {
  --el-bg-color: rgba(255, 255, 255, .92);
}
.yoyo-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 4px;
}
.hint {
  color: #b9d0ee;
  font-size: 11px;
}

/* ② 能力短板 */
.panel {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 26px 28px;
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
  gap: 12px;
}
.panel-head h2 {
  font-size: 18px;
  font-weight: 700;
}
.panel-head .sub {
  margin-top: 4px;
  font-size: 12px;
}
.panel-head a {
  color: var(--teal);
  font-size: 12px;
  cursor: pointer;
}
.ability-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px 22px;
}
.ability-bar {
  padding: 14px 0;
  border-top: 1px solid #edf1f0;
}
.ability-bar.weak {
  border-top-color: #f6cfcf;
}
.ability-label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}
.ability-label strong {
  font-size: 13px;
  color: var(--ink);
}
.ability-label b {
  font-family: Georgia, serif;
  font-size: 18px;
  color: var(--teal);
}
.ability-label b.low {
  color: #b45309;
}
.bar {
  height: 6px;
  background: #e8eeee;
  border-radius: 3px;
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  background: var(--teal);
  transition: width .4s ease;
}
.ability-bar.weak .bar i {
  background: linear-gradient(90deg, #e47f45, #d9653a);
}
.ability-bar small {
  display: block;
  margin-top: 6px;
  color: var(--muted);
  font-size: 11px;
}
.ability-bar.weak small {
  color: #b45309;
}

/* 课程推荐 */
.recommend {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid #edf1f0;
}
.small-eyebrow {
  margin-bottom: 12px;
}
.rec-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}
.rec-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fff;
  transition: transform .15s, box-shadow .15s;
}
.rec-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(31, 67, 115, .12);
}
.rec-cover {
  flex: 0 0 64px;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, .85);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
}
.rec-info {
  min-width: 0;
  flex: 1;
}
.rec-info small {
  display: block;
  font-size: 10px;
  color: var(--muted);
}
.rec-info h4 {
  margin: 4px 0;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rec-info p {
  margin: 0 0 6px;
  font-size: 11px;
  color: #617173;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* ③ 下排：UP NEXT + 消息通知 */
.lower-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 22px;
}
.task-list,
.notice-list {
  display: flex;
  flex-direction: column;
}
.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #edf1f0;
  cursor: pointer;
  transition: background .15s;
}
.task-item:hover {
  background: #fafcfb;
}
.task-item.clickable {
  cursor: pointer;
}
.task-info {
  flex: 1;
  min-width: 0;
}
.task-info strong {
  display: block;
  font-size: 13px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.task-info small {
  display: block;
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
}
.task-meta {
  text-align: right;
  min-width: 78px;
}
.due {
  font-size: 11px;
  color: #b45309;
}
.task-meta .bar {
  margin-top: 6px;
  width: 78px;
}
.empty {
  text-align: center;
  padding: 24px 0;
}
.empty p {
  color: var(--muted);
  font-size: 12px;
  margin-bottom: 12px;
}

/* 消息 */
.notice-actions {
  display: flex;
  gap: 8px;
}
.mark-all {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  color: var(--teal);
}
.go-source {
  flex: 0 0 auto;
  align-self: center;
  color: var(--teal);
  font-size: 11px;
  opacity: 0;
  transition: opacity .15s;
}
.notice-item:hover .go-source {
  opacity: 1;
}
.notice-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 0;
  border-bottom: 1px solid #edf1f0;
  cursor: pointer;
  position: relative;
}
.notice-item:hover {
  background: #fafcfb;
}
.kind-tag {
  flex: 0 0 36px;
  text-align: center;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .5px;
}
.notice-指派 { background: #dceef2; color: #39748b; }
.notice-考试 { background: #fff1c7; color: #9a7310; }
.notice-学习 { background: var(--mint); color: #0f6e56; }
.notice-系统 { background: #edf1f1; color: #617173; }
.notice-body {
  flex: 1;
  min-width: 0;
}
.notice-body strong {
  display: block;
  font-size: 13px;
  margin-bottom: 3px;
}
.notice-body p {
  margin: 0 0 4px;
  font-size: 12px;
  color: #617173;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.notice-body small {
  color: var(--muted);
  font-size: 11px;
}
.notice-item .dot {
  align-self: center;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--orange);
}

/* 响应式 */
@media (max-width: 980px) {
  .yoyo-card {
    grid-template-columns: 1fr;
  }
  .yoyo-figure {
    flex-direction: row;
    justify-content: flex-start;
    gap: 14px;
    padding: 14px 18px;
  }
  .yoyo-msg {
    text-align: left;
    margin-top: 0;
  }
  .lower-grid {
    grid-template-columns: 1fr;
  }
  .board-hero {
    flex-direction: column;
    align-items: flex-start;
  }
  .hero-stats {
    align-self: stretch;
  }
}
</style>
