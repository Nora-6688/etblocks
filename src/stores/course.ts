import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export type CourseCategory = '规章制度' | '企业文化' | '工作流程' | '行业知识' | '岗位知识'
export type CourseDepartment = '共享课程' | '业务部' | '客服部' | '商务部' | '产品部' | '职能部门'
export type CourseType = '文档' | '表格' | 'PPT' | 'PDF' | '视频'
export type CourseDifficulty = '入门' | '进阶' | '高级'

export interface Course {
  id: string
  name: string
  category: CourseCategory
  department: CourseDepartment
  role: string
  type: CourseType
  difficulty: CourseDifficulty
  creator: string
  description: string
  coverUrl: string
  contentUrl: string
  contentName: string
  duration: string
  /** 创建日期（YYYY.MM.DD），由 addCourse 自动写入，用于看板"本月新增"统计 */
  createdAt: string
}

/** 当前日期 YYYY.MM.DD */
function todayStr(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

const defaultCourses: Course[] = [
  { id: 'c1', name: '企业文化入门', category: '企业文化', department: '共享课程', role: '业务岗', type: '视频', difficulty: '入门', creator: 'Nora', description: '了解公司发展历程、核心价值观和行为准则。', coverUrl: '', contentUrl: '', contentName: '', duration: '45 分钟', createdAt: '2026.05.10' },
  { id: 'c2', name: '业务流程规范', category: '工作流程', department: '业务部', role: '业务岗', type: '文档', difficulty: '入门', creator: 'Nora', description: '掌握合同审批、报销、出差等标准流程。', coverUrl: '', contentUrl: '', contentName: '', duration: '30 分钟', createdAt: '2026.06.02' },
  { id: 'c3', name: '客户服务标准', category: '岗位知识', department: '客服部', role: '客服岗', type: 'PPT', difficulty: '进阶', creator: 'Nora', description: '客户沟通话术、投诉处理流程、服务标准。', coverUrl: '', contentUrl: '', contentName: '', duration: '60 分钟', createdAt: '2026.07.18' },
  { id: 'c4', name: '产品知识体系', category: '行业知识', department: '产品部', role: '产品岗', type: '视频', difficulty: '高级', creator: 'Nora', description: '产品核心参数、竞品分析、技术原理。', coverUrl: '', contentUrl: '', contentName: '', duration: '90 分钟', createdAt: '2026.08.05' },
  { id: 'c5', name: '规章制度精讲', category: '规章制度', department: '共享课程', role: '业务岗', type: 'PDF', difficulty: '入门', creator: 'Nora', description: '考勤、薪酬、福利、奖惩制度详解。', coverUrl: '', contentUrl: '', contentName: '', duration: '40 分钟', createdAt: '2026.06.22' },
  { id: 'c6', name: '商务谈判技巧', category: '岗位知识', department: '商务部', role: '商务岗', type: '视频', difficulty: '高级', creator: 'Nora', description: '谈判策略、心理学技巧、实战案例分析。', coverUrl: '', contentUrl: '', contentName: '', duration: '75 分钟', createdAt: '2026.08.15' },
  { id: 'c7', name: '客服操作手册', category: '岗位知识', department: '客服部', role: '客服岗', type: '文档', difficulty: '入门', creator: 'Nora', description: '系统操作、工单处理、FAQ 知识库使用。', coverUrl: '', contentUrl: '', contentName: '', duration: '25 分钟', createdAt: '2026.07.30' },
]

export const useCourseStore = defineStore('course', () => {
  const courses = ref<Course[]>([...defaultCourses])

  const videoCourses = computed(() => courses.value.filter((c) => c.type === '视频'))

  function getCourseById(id: string) {
    return courses.value.find((c) => c.id === id)
  }

  function addCourse(course: Omit<Course, 'id' | 'createdAt'>) {
    const id = 'c' + Date.now()
    courses.value.unshift({ ...course, id, createdAt: todayStr() })
    return id
  }

  function updateCourse(id: string, data: Partial<Course>) {
    const course = courses.value.find((c) => c.id === id)
    if (course) Object.assign(course, data)
  }

  function removeCourse(id: string) {
    courses.value = courses.value.filter((c) => c.id !== id)
  }

  return { courses, videoCourses, getCourseById, addCourse, updateCourse, removeCourse }
})
