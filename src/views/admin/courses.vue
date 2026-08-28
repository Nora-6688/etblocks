<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCourseStore, type Course, type CourseCategory, type CourseDepartment, type CourseType, type CourseDifficulty } from '@/stores/course'

const store = useCourseStore()
const departments: (CourseDepartment | '全部')[] = ['全部', '共享课程', '业务部', '客服部', '商务部', '产品部', '职能部门']
const activeDepartment = ref<CourseDepartment | '全部'>('全部')
const keyword = ref('')
const contentType = ref('全部类型')
const category = ref('全部分类')
const dialogVisible = ref(false)
const editingCourse = ref<Course | null>(null)
const editingName = ref('')
const editingCategory = ref<CourseCategory>('企业文化')
const editingDepartment = ref<CourseDepartment>('共享课程')
const editingType = ref<CourseType>('视频')
const editingDifficulty = ref<CourseDifficulty>('入门')
const editingDescription = ref('')
const coverUrl = ref('')
const coverFileName = ref('')
const contentUrl = ref('')
const contentFileName = ref('')

const filteredCourses = computed(() => store.courses.filter((course) => course.name.includes(keyword.value) && (activeDepartment.value === '全部' || course.department === activeDepartment.value) && (contentType.value === '全部类型' || course.type === contentType.value) && (category.value === '全部分类' || course.category === category.value)))

function departmentMark(department: CourseDepartment) { return department === '共享课程' ? '共' : department === '业务部' ? '业' : department === '客服部' ? '客' : department === '商务部' ? '商' : department === '产品部' ? '产' : '职' }

function openCreate() {
  editingCourse.value = null
  editingName.value = ''
  editingCategory.value = '企业文化'
  editingDepartment.value = '共享课程'
  editingType.value = '视频'
  editingDifficulty.value = '入门'
  editingDescription.value = ''
  coverUrl.value = ''
  coverFileName.value = ''
  contentUrl.value = ''
  contentFileName.value = ''
  dialogVisible.value = true
}

function openEdit(course: Course) {
  editingCourse.value = course
  editingName.value = course.name
  editingCategory.value = course.category
  editingDepartment.value = course.department
  editingType.value = course.type
  editingDifficulty.value = course.difficulty
  editingDescription.value = course.description
  coverUrl.value = course.coverUrl
  coverFileName.value = course.coverUrl ? '已上传封面图' : ''
  contentUrl.value = course.contentUrl
  contentFileName.value = course.contentName || ''
  dialogVisible.value = true
}

function selectCover(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    coverFileName.value = file.name
    coverUrl.value = URL.createObjectURL(file)
  }
}

function selectContent(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    contentFileName.value = file.name
    contentUrl.value = URL.createObjectURL(file)
  }
}

function saveCourse() {
  if (!editingName.value.trim()) {
    ElMessage.warning('请输入课程名称')
    return
  }
  const data = {
    name: editingName.value.trim(),
    category: editingCategory.value,
    department: editingDepartment.value,
    type: editingType.value,
    difficulty: editingDifficulty.value,
    description: editingDescription.value.trim() || '暂无课程简介。',
    coverUrl: coverUrl.value,
    contentUrl: contentUrl.value,
    contentName: contentFileName.value,
  }
  if (editingCourse.value) {
    store.updateCourse(editingCourse.value.id, data)
  } else {
    store.addCourse({ ...data, role: '全员', creator: 'Nora', duration: '45 分钟' })
  }
  dialogVisible.value = false
  ElMessage.success('课程信息已保存')
}

async function removeCourse(course: Course) {
  await ElMessageBox.confirm(`确定删除《${course.name}》吗？`, '删除课程', { type: 'warning' })
  store.removeCourse(course.id)
  ElMessage.success('课程已删除')
}

function reset() { keyword.value = ''; activeDepartment.value = '全部'; contentType.value = '全部类型'; category.value = '全部分类' }
</script>

<template>
  <section class="page-header"><div><h1>课程管理</h1><p>上传、分类、标签化管理培训内容 · 编辑后学员端同步展示</p></div><el-button type="primary" @click="openCreate">＋ 上传课程</el-button></section>
  <div class="department-tabs"><button v-for="item in departments" :key="item" :class="{ active: activeDepartment === item }" @click="activeDepartment = item">{{ item }}</button></div>
  <div class="filter-bar"><el-input v-model="keyword" placeholder="课程名称..." clearable /><el-select v-model="contentType"><el-option label="全部类型" value="全部类型" /><el-option label="文档" value="文档" /><el-option label="表格" value="表格" /><el-option label="PPT" value="PPT" /><el-option label="PDF" value="PDF" /><el-option label="视频" value="视频" /></el-select><el-select v-model="category"><el-option label="全部分类" value="全部分类" /><el-option label="规章制度" value="规章制度" /><el-option label="企业文化" value="企业文化" /><el-option label="工作流程" value="工作流程" /><el-option label="行业知识" value="行业知识" /><el-option label="岗位知识" value="岗位知识" /></el-select><el-button @click="reset">重置</el-button></div>
  <div class="table-wrap"><table><thead><tr><th>课程名称</th><th>分类</th><th>所属部门</th><th>类型</th><th>难度</th><th>创建人</th><th>封面图</th><th>操作</th></tr></thead><tbody><tr v-for="course in filteredCourses" :key="course.id"><td class="course-name">{{ course.name }}</td><td><span class="category-tag" :class="course.category">{{ course.category }}</span></td><td><span class="department-cell"><i :class="course.department">{{ departmentMark(course.department) }}</i>{{ course.department }}</span></td><td>{{ course.type }}</td><td>{{ course.difficulty }}</td><td>{{ course.creator }}</td><td><span class="cover-tag" :class="{ has: course.coverUrl }">{{ course.coverUrl ? '已设置' : '默认色' }}</span></td><td class="actions"><button @click="openEdit(course)">编辑</button><button class="delete" @click="removeCourse(course)">删除</button></td></tr><tr v-if="!filteredCourses.length"><td colspan="8" class="empty">暂无匹配课程</td></tr></tbody></table></div>
  <el-dialog v-model="dialogVisible" :title="editingCourse ? '编辑课程' : '上传课程'" width="780px" class="course-dialog"><el-form label-position="top"><div class="form-grid"><el-form-item label="课程名称"><el-input v-model="editingName" placeholder="请输入课程名称" /></el-form-item><el-form-item label="内容分类（决定封面颜色）"><el-select v-model="editingCategory"><el-option label="规章制度" value="规章制度"/><el-option label="企业文化" value="企业文化"/><el-option label="工作流程" value="工作流程"/><el-option label="行业知识" value="行业知识"/><el-option label="岗位知识" value="岗位知识"/></el-select></el-form-item><el-form-item label="所属部门"><el-select v-model="editingDepartment"><el-option v-for="item in departments.slice(1)" :key="item" :label="item" :value="item"/></el-select></el-form-item><el-form-item label="类型"><el-select v-model="editingType"><el-option v-for="item in ['文档','表格','PPT','PDF','视频']" :key="item" :label="item" :value="item"/></el-select></el-form-item><el-form-item label="难度"><el-select v-model="editingDifficulty"><el-option v-for="item in ['入门','进阶','高级']" :key="item" :label="item" :value="item"/></el-select></el-form-item></div><el-form-item label="课程封面图（学员端展示，可随时更换）"><div class="upload-row"><div class="cover-preview" :class="editingCategory"><img v-if="coverUrl" :src="coverUrl" alt="封面预览" /><template v-if="!coverUrl">{{ editingCategory.slice(0, 1) }} · {{ editingCategory }}</template></div><label class="file-button">上传 / 更换封面图<input type="file" accept="image/*" @change="selectCover" /></label><span class="file-name">{{ coverFileName || '未上传时按分类颜色展示' }}</span></div></el-form-item><el-form-item label="课程内容文件"><label class="dropzone">上传文档、表格、PPT、PDF 或视频<input type="file" accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,video/*" @change="selectContent" /><small>{{ contentFileName || '点击选择文件' }}</small></label></el-form-item><el-form-item label="课程简介"><el-input v-model="editingDescription" type="textarea" :rows="3" placeholder="简要介绍课程内容..." /></el-form-item></el-form><template #footer><el-button class="cancel-button" @click="dialogVisible = false">取消</el-button><el-button type="primary" class="save-button" @click="saveCourse">保存</el-button></template></el-dialog>
</template>

<style scoped>
.page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}.page-header h1{font-size:20px;font-weight:600}.page-header p{color:var(--muted);font-size:13px;margin-top:3px}.department-tabs{display:flex;gap:9px;margin-bottom:17px;flex-wrap:wrap}.department-tabs button{padding:7px 16px;border:1px solid var(--line);border-radius:7px;background:#fff;color:var(--muted);cursor:pointer;font-size:13px}.department-tabs button.active{border-color:var(--teal);background:var(--teal);color:#fff}.filter-bar{display:flex;align-items:center;gap:12px;padding:16px 20px;margin-bottom:20px;border:1px solid var(--line);border-radius:12px;background:#fff}.filter-bar .el-input{width:220px}.table-wrap{overflow:auto;border:1px solid var(--line);border-radius:12px;background:#fff}table{width:100%;border-collapse:collapse;min-width:950px}th{padding:13px 18px;border-bottom:1px solid var(--line);background:#fafbfc;color:var(--muted);font-size:12px;font-weight:500;text-align:left}td{padding:14px 18px;border-bottom:1px solid var(--line);color:#243b59;font-size:13px}tr:last-child td{border-bottom:0}.course-name{font-weight:500;color:#173d6b}.category-tag,.cover-tag{display:inline-block;padding:4px 9px;border-radius:5px;background:var(--mint);color:var(--teal);font-size:11px}.cover-tag.has{background:var(--mint);color:var(--teal)}.category-tag.工作流程{background:#e1f5ee;color:#0f6e56}.category-tag.岗位知识{background:#eeedfe;color:#534ab7}.category-tag.行业知识{background:#faeeda;color:#b45309}.category-tag.规章制度{background:#f1efe8;color:#5f5e5a}.department-cell{display:inline-flex;align-items:center;gap:7px}.department-cell i{display:grid;place-items:center;width:23px;height:23px;border-radius:50%;background:#185fa5;color:#fff;font-size:10px;font-style:normal}.department-cell i.客服部{background:#0f6e56}.department-cell i.商务部{background:#b45309}.department-cell i.产品部{background:#534ab7}.department-cell i.职能部门{background:#6b7280}.actions{white-space:nowrap}.actions button{padding:5px 11px;margin-right:5px;border:1px solid var(--line);border-radius:6px;background:#fff;color:#52677e;cursor:pointer;font-size:11px}.actions button:hover{border-color:var(--teal);color:var(--teal)}.actions .delete{color:#a32d2d}.empty{text-align:center;color:var(--muted);padding:40px}@media(max-width:600px){.page-header{align-items:flex-start;gap:12px}.filter-bar{flex-wrap:wrap}.filter-bar .el-input{width:100%}}
.filter-bar { justify-content: flex-start; }
.filter-bar .el-input { width: 280px; flex: 0 0 280px; }
.filter-bar .el-select { width: 180px; flex: 0 0 180px; }
.course-dialog :deep(.el-dialog) { border-radius: 14px; }
.course-dialog :deep(.el-dialog__body) { padding-top: 14px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; }
.form-grid :deep(.el-select) { width: 100%; }
.upload-row { display: flex; align-items: center; gap: 14px; min-height: 70px; }
.cover-preview { display: grid; place-items: center; width: 120px; height: 70px; border-radius: 8px; background: #2d6ead; color: #fff; font-size: 13px; font-weight: 600; overflow: hidden; }
.cover-preview img { width: 100%; height: 100%; object-fit: cover; }
.cover-preview.工作流程 { background: #0f6e56; }.cover-preview.岗位知识 { background: #534ab7; }.cover-preview.行业知识 { background: #b45309; }.cover-preview.规章制度 { background: #6b7280; }
.file-button { padding: 7px 13px; border: 1px solid var(--line); border-radius: 6px; color: #52677e; cursor: pointer; font-size: 12px; }
.file-button input, .dropzone input { display: none; }
.file-name { color: #9ca3af; font-size: 12px; }
.dropzone { display: grid; place-items: center; gap: 5px; width: 100%; min-height: 78px; border: 2px dashed #d9e1e9; border-radius: 8px; color: var(--teal); cursor: pointer; font-size: 13px; }
.dropzone small { color: #9ca3af; font-size: 11px; }
.save-button { width: 100%; height: 46px; margin-left: 0 !important; }
.cancel-button { display: none; }
@media (max-width: 600px) {
  .filter-bar .el-input,
  .filter-bar .el-select { width: 100%; flex: 1 1 100%; }
  .form-grid { grid-template-columns: 1fr; }
  .upload-row { align-items: flex-start; flex-wrap: wrap; }
}
</style>
