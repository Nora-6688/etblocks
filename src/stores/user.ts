import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 学员基础信息。
 * 数据来源：管理端学员管理（admin/students.vue）创建/修改后会同步过来。
 * 这里只读不写，所以学员端只展示。
 */
export interface LearnerProfile {
  /** 工号 */
  workId: string
  /** 姓名 */
  name: string
  /** 部门 */
  department: string
  /** 岗位（例如：业务岗、客服岗、商务专员） */
  role: string
  /** 岗位层级：新人期 / 成长期 / 专业期 / 资深期 */
  level: '新人期' | '成长期' | '专业期' | '资深期'
  /** 入职时间 yyyy.MM.dd */
  joinDate: string
  /** 账号状态：已开通 / 已关闭 */
  accountStatus: '已开通' | '已关闭'
  /** 头像颜色（按部门） */
  avatarColor: string
  /** 企业邮箱 */
  email: string
}

/** 默认档案：演示用 Nora，等管理端真接进来后会从后端读取 */
const defaultProfile: LearnerProfile = {
  workId: 'BD003',
  name: 'Nora',
  department: '业务部',
  role: '业务岗',
  level: '成长期',
  joinDate: '2026.03.12',
  accountStatus: '已开通',
  avatarColor: '#534ab7',
  email: 'nora@ford.com',
}

export const useUserStore = defineStore('user', () => {
  /** 当前登录学员的基础信息 */
  const profile = ref<LearnerProfile>({ ...defaultProfile })

  /** 演示用：管理端关闭/开通账号后会同步过来 */
  function setAccountStatus(status: LearnerProfile['accountStatus']) {
    profile.value.accountStatus = status
  }
  /** 演示用：管理端修改岗位层级后会同步过来 */
  function setLevel(level: LearnerProfile['level']) {
    profile.value.level = level
  }

  return { profile, setAccountStatus, setLevel }
})
