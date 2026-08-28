<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useCourseStore, type CourseCategory } from '@/stores/course'
import { useTodoStore } from '@/stores/todo'
import { useBlockStore } from '@/stores/blocks'

const router = useRouter()
const store = useCourseStore()
const todoStore = useTodoStore()
const blockStore = useBlockStore()

const categoryColors: Record<CourseCategory, string> = {
  企业文化: '#185fa5',
  工作流程: '#0f6e56',
  岗位知识: '#534ab7',
  行业知识: '#b45309',
  规章制度: '#6b7280',
}

type View = 'course' | 'block'
const view = ref<View>('course')
const keyword = ref('')
const role = ref('全部岗位')
const level = ref('全部层级')
const category = ref('全部分类')
const filteredCourses = computed(() =>
  store.courses.filter(
    (item) =>
      item.name.includes(keyword.value) &&
      (role.value === '全部岗位' || item.role === role.value) &&
      (level.value === '全部层级' || item.difficulty === level.value) &&
      (category.value === '全部分类' || item.category === category.value),
  ),
)
const filteredBlocks = computed(() =>
  blockStore.blocks.filter(
    (item) =>
      item.title.includes(keyword.value) &&
      (role.value === '全部岗位' || item.role === role.value) &&
      (level.value === '全部层级' || item.level === level.value),
  ),
)
function reset() {
  keyword.value = ''
  role.value = '全部岗位'
  level.value = '全部层级'
  category.value = '全部分类'
}

/** 加入待学：课程 */
function addCourse(courseId: string, title: string, type: string, duration: string, category: CourseCategory) {
  const ok = todoStore.addTodo({
    sourceType: 'course',
    sourceId: courseId,
    title,
    meta: `${type} · ${duration}`,
    type: '课程',
    coverColor: categoryColors[category],
  })
  if (ok) ElMessage.success(`已将《${title}》加入待学内容`)
  else ElMessage.warning(`《${title}》已在待学列表中`)
}

/** 加入待学：Blocks */
function addBlock(blockId: string, title: string, duration: string, color: string) {
  const ok = todoStore.addTodo({
    sourceType: 'block',
    sourceId: blockId,
    title,
    meta: `Blocks · ${duration}`,
    type: 'Blocks',
    coverColor: color,
  })
  if (ok) ElMessage.success(`已将《${title}》加入待学内容`)
  else ElMessage.warning(`《${title}》已在待学列表中`)
}

/** 判断是否已加入待学：用于按钮状态 */
function isAddedCourse(courseId: string) {
  return todoStore.hasTodo('course', courseId)
}
function isAddedBlock(blockId: string) {
  return todoStore.hasTodo('block', blockId)
}

function openCourse(id: string) {
  router.push(`/course/${id}`)
}
function openBlock(id: string) {
  router.push(`/block/${id}`)
}
</script>
<template>
  <section class="page-head">
    <div>
      <div class="overline">LEARNING LIBRARY</div>
      <h1>学习列表</h1>
      <p>课程与 Blocks 学习内容</p>
    </div>
    <span class="total"
      >{{ view === 'course' ? filteredCourses.length : filteredBlocks.length }} 项内容</span
    >
  </section>
  <div class="switcher">
    <button :class="{ active: view === 'course' }" @click="view = 'course'">
      <span class="switch-icon">▣</span><span><b>课程</b><small>单个课程内容</small></span></button
    ><button :class="{ active: view === 'block' }" @click="view = 'block'">
      <span class="switch-icon">▦</span><span><b>Blocks</b><small>组合学习内容</small></span>
    </button>
  </div>
  <div class="filter-bar">
    <el-input
      class="course-search"
      v-model="keyword"
      placeholder="搜索课程名称"
      clearable
    /><el-select v-model="role"
      ><el-option label="全部岗位" value="全部岗位" /><el-option
        label="业务岗"
        value="业务岗" /><el-option label="客服岗" value="客服岗" /><el-option
        label="商务岗"
        value="商务岗" /><el-option label="产品岗" value="产品岗" /><el-option
        label="职能岗"
        value="职能岗" /></el-select
    ><el-select v-model="level"
      ><el-option label="全部层级" value="全部层级" /><el-option
        label="新人期"
        value="新人期" /><el-option label="成长期" value="成长期" /><el-option
        label="专业期"
        value="专业期" /><el-option label="资深期" value="资深期" /></el-select
    ><el-select v-if="view === 'course'" v-model="category"
      ><el-option label="全部分类" value="全部分类" /><el-option
        label="规章制度"
        value="规章制度" /><el-option label="企业文化" value="企业文化" /><el-option
        label="工作流程"
        value="工作流程" /><el-option label="行业知识" value="行业知识" /><el-option
        label="岗位知识"
        value="岗位知识" /></el-select
    ><el-button @click="reset">重置</el-button
    ><el-button text @click="ElMessage.success('列表已刷新')">刷新</el-button>
  </div>
  <div v-if="view === 'course'" class="course-grid">
    <article
      v-for="course in filteredCourses"
      :key="course.id"
      class="course-card"
      @click="openCourse(course.id)"
    >
      <div class="cover" :style="{ background: categoryColors[course.category] }">
        <img v-if="course.coverUrl" :src="course.coverUrl" alt="封面" class="cover-img" />
        <span v-else>{{ course.category }}</span
        ><b>{{ course.type }}</b>
      </div>
      <div class="course-body">
        <div class="tags">
          <em>{{ course.role }}</em
          ><em>{{ course.difficulty }}</em
          ><em>{{ course.type }}</em>
        </div>
        <h2>{{ course.name }}</h2>
        <p>{{ course.description }}</p>
        <div class="meta">
          <span>{{ course.duration }}</span
          ><span>{{ course.type }}</span>
        </div>
        <div class="card-footer">
          <span>查看课程详情</span
          ><button
            v-if="!isAddedCourse(course.id)"
            @click.stop="addCourse(course.id, course.name, course.type, course.duration, course.category)"
          >
            ＋ 加入待学
          </button>
          <button v-else class="added" disabled>✓ 已加入待学</button>
        </div>
      </div>
    </article>
  </div>
  <div v-else class="block-grid">
    <article
      v-for="block in filteredBlocks"
      :key="block.id"
      class="block-card"
      @click="openBlock(block.id)"
    >
      <div class="block-top">
        <div class="block-mark" :style="{ background: block.color }">B</div>
        <div>
          <span class="block-label">组合课程 Blocks</span>
          <h2>{{ block.title }}</h2>
        </div>
      </div>
      <p>{{ block.description }}</p>
      <div class="block-content">
        <span v-for="(content, index) in block.contents" :key="content"
          ><i>{{ index + 1 }}</i
          >{{ content }}</span
        >
      </div>
      <div class="block-footer">
        <span>{{ block.role }} · {{ block.level }} · {{ block.duration }}</span
        ><button
          v-if="!isAddedBlock(block.id)"
          @click.stop="addBlock(block.id, block.title, block.duration, block.color)"
        >
          ＋ 加入待学
        </button>
        <button v-else class="added" disabled>✓ 已加入待学</button>
      </div>
    </article>
  </div>
</template>
<style scoped>
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: end;
  margin-bottom: 22px;
}
.overline {
  color: var(--teal);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
}
.page-head h1 {
  font-size: 22px;
  font-weight: 600;
  margin: 5px 0;
}
.page-head p,
.total {
  color: var(--muted);
  font-size: 12px;
}
.switcher {
  display: flex;
  border-bottom: 1px solid var(--line);
  margin-bottom: 16px;
}
.switcher button {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 150px;
  padding: 13px 16px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--muted);
  text-align: left;
  cursor: pointer;
}
.switcher button.active {
  border-bottom-color: var(--teal);
  color: var(--teal);
  background: var(--mint);
}
.switch-icon {
  font-size: 20px;
}
.switcher b,
.switcher small {
  display: block;
}
.switcher b {
  font-size: 13px;
  font-weight: 600;
}
.switcher small {
  font-size: 10px;
  margin-top: 2px;
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  margin-bottom: 18px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
}
.filter-bar .el-input {
  width: 320px;
}
.filter-bar .course-search {
  width: 400px;
}
.course-grid,
.block-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.course-card,
.block-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}
.course-card:hover,
.block-card:hover {
  border-color: var(--teal);
  box-shadow: 0 4px 12px #185fa51a;
}
.cover {
  height: 106px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px;
  color: #fff;
  position: relative;
  overflow: hidden;
}
.cover-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover > span,
.cover > b {
  position: relative;
  z-index: 1;
}
.cover span {
  padding: 3px 7px;
  border: 1px solid #ffffff80;
  font-size: 10px;
}
.cover b {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
}
.course-body {
  padding: 16px;
}
.tags {
  display: flex;
  gap: 5px;
}
.tags em {
  padding: 3px 6px;
  background: var(--mint);
  color: var(--teal);
  font-size: 10px;
  font-style: normal;
}
.course-body h2,
.block-card h2 {
  font-size: 15px;
  font-weight: 600;
  margin: 11px 0 5px;
}
.course-body p,
.block-card > p {
  height: 38px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.7;
}
.meta {
  display: flex;
  gap: 12px;
  color: var(--muted);
  font-size: 10px;
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
}
.card-footer,
.block-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  color: var(--muted);
  font-size: 10px;
}
.card-footer button,
.block-footer button {
  border: 1px solid #b8cfe7;
  background: var(--mint);
  color: var(--teal);
  padding: 6px 9px;
  cursor: pointer;
  font-size: 10px;
}
.card-footer button.added,
.block-footer button.added {
  border-color: #c9d6df;
  background: #f1f5f7;
  color: #9ca3af;
  cursor: not-allowed;
}
.block-card {
  padding: 20px;
}
.block-top {
  display: flex;
  align-items: center;
  gap: 12px;
}
.block-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  color: #fff;
  font-size: 17px;
  font-weight: 700;
}
.block-label {
  color: var(--teal);
  font-size: 10px;
}
.block-card h2 {
  margin: 3px 0 0;
}
.block-card > p {
  margin: 15px 0 10px;
}
.block-content {
  padding: 10px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
.block-content span {
  display: block;
  padding: 4px 0;
  color: #53666d;
  font-size: 11px;
}
.block-content i {
  display: inline-grid;
  place-items: center;
  width: 17px;
  height: 17px;
  margin-right: 7px;
  border-radius: 50%;
  background: var(--mint);
  color: var(--teal);
  font-style: normal;
  font-size: 9px;
}
.block-footer {
  padding-top: 14px;
}
.block-footer span {
  max-width: 190px;
  line-height: 1.5;
}
@media (max-width: 900px) {
  .course-grid,
  .block-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .switcher button {
    min-width: 0;
    flex: 1;
  }
  .filter-bar {
    flex-wrap: wrap;
  }
  .filter-bar .el-input,
  .filter-bar .course-search {
    width: 100%;
  }
  .course-grid,
  .block-grid {
    grid-template-columns: 1fr;
  }
  .page-head {
    align-items: start;
  }
  .total {
    margin-top: 22px;
  }
}
</style>
