<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useCourseStore, type CourseCategory } from '@/stores/course'
import { useTodoStore } from '@/stores/todo'

const route = useRoute()
const router = useRouter()
const store = useCourseStore()
const todoStore = useTodoStore()
const course = computed(() => store.getCourseById(String(route.params.id)))

const activeTab = ref<'intro' | 'catalog' | 'comments'>('intro')

/** 来源：从待学进来的 → from=todo；从 Blocks 详情进来的 → from=block:xxx */
const from = computed(() => String(route.query.from ?? ''))
const backLabel = computed(() => {
  if (from.value === 'todo') return '← 返回待学内容'
  if (from.value.startsWith('block:')) return '← 返回 Blocks'
  return '← 返回学习列表'
})
const isInTodo = computed(
  () => course.value && todoStore.hasTodo('course', course.value.id),
)
/** 是否从 Blocks 详情点进来的——这种"包内课程"已经在 Block 里了，单课不能再加入待学 */
const isFromBlock = computed(() => from.value.startsWith('block:'))

const categoryColors: Record<CourseCategory, string> = {
  企业文化: '#185fa5',
  工作流程: '#0f6e56',
  岗位知识: '#534ab7',
  行业知识: '#b45309',
  规章制度: '#6b7280',
}

function startLearning() {
  if (!course.value) return
  if (course.value.type === '视频' && course.value.contentUrl) {
    router.push({ path: `/course/play/${course.value.id}`, query: route.query })
  } else if (course.value.contentUrl) {
    window.open(course.value.contentUrl, '_blank')
  } else {
    ElMessage.info('该课程暂未上传内容文件')
  }
}

function goBack() {
  if (from.value === 'todo') router.push('/todo')
  else if (from.value.startsWith('block:')) router.push(`/block/${from.value.slice(6)}`)
  else router.push('/learning')
}

function addToTodo() {
  if (!course.value) return
  const ok = todoStore.addTodo({
    sourceType: 'course',
    sourceId: course.value.id,
    title: course.value.name,
    meta: `${course.value.type} · ${course.value.duration}`,
    type: '课程',
    coverColor: categoryColors[course.value.category],
  })
  if (ok) ElMessage.success(`已将《${course.value.name}》加入待学内容`)
  else ElMessage.warning(`《${course.value.name}》已在待学列表中`)
}
</script>

<template>
  <div v-if="course" class="course-detail">
    <div class="detail-nav">
      <button @click="goBack">{{ backLabel }}</button>
    </div>
    <div class="detail-header">
      <div class="cover" :style="{ background: categoryColors[course.category] }">
        <img v-if="course.coverUrl" :src="course.coverUrl" alt="封面" />
        <span v-else class="cover-fallback">{{ course.category }}</span>
      </div>
      <div class="header-info">
        <div class="tags">
          <em>{{ course.category }}</em>
          <em>{{ course.department }}</em>
          <em>{{ course.difficulty }}</em>
          <em>{{ course.type }}</em>
        </div>
        <h1>{{ course.name }}</h1>
        <p class="desc">{{ course.description }}</p>
        <div class="meta-row">
          <span>讲师：{{ course.creator }}</span>
          <span>时长：{{ course.duration }}</span>
          <span>适用岗位：{{ course.role }}</span>
        </div>
        <div class="action-row">
          <el-button type="primary" size="large" @click="startLearning">
            {{ course.type === '视频' ? '▶ 开始学习' : '查看课程内容' }}
          </el-button>
          <!-- 仅当不是从 Blocks 包点进来、且单课未在待学时，才显示加入待学 -->
          <el-button v-if="!isFromBlock && !isInTodo" size="large" @click="addToTodo">＋ 加入待学</el-button>
          <el-button v-else-if="!isFromBlock" size="large" disabled>✓ 已在待学</el-button>
          <!-- Blocks 包内的课程：直接展示所在 Blocks 的提示，不再有加入待学入口 -->
          <span v-else class="in-block-tip">已包含在 Blocks 包中</span>
        </div>
      </div>
    </div>
    <div class="tab-bar">
      <button :class="{ active: activeTab === 'intro' }" @click="activeTab = 'intro'">课程详情</button>
      <button :class="{ active: activeTab === 'catalog' }" @click="activeTab = 'catalog'">课程目录</button>
      <button :class="{ active: activeTab === 'comments' }" @click="activeTab = 'comments'">课程评价</button>
    </div>
    <div class="tab-content">
      <div v-if="activeTab === 'intro'" class="intro-panel">
        <h3>课程简介</h3>
        <p>{{ course.description }}</p>
        <h3>学习目标</h3>
        <ul>
          <li>掌握{{ course.category }}相关的核心知识点</li>
          <li>理解{{ course.department }}的业务背景与工作要求</li>
          <li>能够将所学内容应用于实际工作中</li>
        </ul>
        <h3>适合人群</h3>
        <p>{{ course.role }} · {{ course.difficulty }}难度</p>
        <h3 v-if="course.contentName">课程资料</h3>
        <p v-if="course.contentName" class="file-info">📎 {{ course.contentName }}</p>
      </div>
      <div v-else-if="activeTab === 'catalog'" class="catalog-panel">
        <div class="chapter">
          <i>1</i>
          <div>
            <b>课程导读</b>
            <small>5 分钟 · 图文</small>
          </div>
        </div>
        <div class="chapter">
          <i>2</i>
          <div>
            <b>核心内容讲解</b>
            <small>{{ course.duration }} · {{ course.type }}</small>
          </div>
          <button class="play-btn" @click="startLearning">▶</button>
        </div>
        <div class="chapter">
          <i>3</i>
          <div>
            <b>课后总结</b>
            <small>5 分钟 · 图文</small>
          </div>
        </div>
        <div class="chapter">
          <i>4</i>
          <div>
            <b>随堂练习</b>
            <small>10 分钟 · 练习题</small>
          </div>
        </div>
      </div>
      <div v-else class="comments-panel">
        <div class="comment-item">
          <div class="avatar">T</div>
          <div>
            <b>Tommy</b>
            <small>2026.08.20</small>
            <p>课程内容很实用，讲解清晰，推荐新人学习。</p>
          </div>
        </div>
        <div class="comment-item">
          <div class="avatar">S</div>
          <div>
            <b>Selina</b>
            <small>2026.08.22</small>
            <p>案例很贴近实际工作场景，受益匪浅。</p>
          </div>
        </div>
        <div class="comment-input">
          <el-input type="textarea" :rows="3" placeholder="写下你的评价..." />
          <el-button type="primary" @click="ElMessage.success('评价已提交')">发表评价</el-button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="not-found">
    <p>课程不存在或已下架</p>
    <el-button type="primary" @click="goBack">返回学习列表</el-button>
  </div>
</template>

<style scoped>
.course-detail { max-width: 900px; margin: 0 auto; }
.detail-nav { margin-bottom: 16px; }
.detail-nav button { border: 0; background: transparent; color: var(--teal); cursor: pointer; font-size: 13px; }
.detail-header { display: flex; gap: 24px; background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 24px; margin-bottom: 20px; }
.cover { width: 240px; height: 140px; border-radius: 8px; flex-shrink: 0; display: grid; place-items: center; overflow: hidden; }
.cover img { width: 100%; height: 100%; object-fit: cover; }
.cover-fallback { color: #fff; font-size: 16px; font-weight: 600; }
.header-info { flex: 1; }
.tags { display: flex; gap: 6px; margin-bottom: 10px; }
.tags em { padding: 3px 8px; border-radius: 4px; background: var(--mint); color: var(--teal); font-size: 11px; font-style: normal; }
.header-info h1 { font-size: 22px; font-weight: 600; margin-bottom: 8px; }
.desc { color: var(--muted); font-size: 13px; line-height: 1.7; margin-bottom: 14px; }
.meta-row { display: flex; gap: 20px; margin-bottom: 18px; }
.meta-row span { color: var(--muted); font-size: 12px; }
.action-row { display: flex; gap: 10px; align-items: center; }
.in-block-tip { font-size: 12px; color: var(--muted); padding: 0 6px; }
.tab-bar { display: flex; border-bottom: 1px solid var(--line); margin-bottom: 20px; }
.tab-bar button { padding: 12px 20px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--muted); cursor: pointer; font-size: 14px; }
.tab-bar button.active { border-bottom-color: var(--teal); color: var(--teal); font-weight: 600; }
.tab-content { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 24px; min-height: 200px; }
.intro-panel h3 { font-size: 14px; margin: 0 0 8px; }
.intro-panel p { color: #52677e; font-size: 13px; line-height: 1.8; margin: 0 0 20px; }
.intro-panel ul { margin: 0 0 20px; padding-left: 20px; }
.intro-panel li { color: #52677e; font-size: 13px; line-height: 2; }
.file-info { color: var(--teal); font-size: 13px; }
.catalog-panel { display: grid; gap: 12px; }
.chapter { display: flex; align-items: center; gap: 14px; padding: 14px; border: 1px solid var(--line); border-radius: 8px; }
.chapter i { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--mint); color: var(--teal); font-style: normal; font-size: 13px; }
.chapter > div { flex: 1; }
.chapter b { display: block; font-size: 13px; margin-bottom: 3px; }
.chapter small { color: var(--muted); font-size: 11px; }
.play-btn { border: 0; border-radius: 50%; width: 36px; height: 36px; background: var(--teal); color: #fff; cursor: pointer; font-size: 14px; }
.comments-panel { display: grid; gap: 16px; }
.comment-item { display: flex; gap: 12px; }
.avatar { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--teal); color: #fff; font-size: 14px; flex-shrink: 0; }
.comment-item b { font-size: 13px; }
.comment-item small { color: var(--muted); font-size: 11px; margin-left: 8px; }
.comment-item p { color: #52677e; font-size: 12px; margin: 5px 0 0; }
.comment-input { margin-top: 10px; }
.comment-input .el-button { margin-top: 10px; }
.not-found { display: grid; place-items: center; gap: 16px; min-height: 300px; }
.not-found p { color: var(--muted); font-size: 14px; }
@media (max-width: 700px) {
  .detail-header { flex-direction: column; }
  .cover { width: 100%; height: 160px; }
  .meta-row { flex-wrap: wrap; gap: 10px; }
}
</style>
