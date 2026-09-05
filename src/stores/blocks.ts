import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface BlockItem {
  id: string
  title: string
  role: string
  level: string
  contents: string[]
  duration: string
  description: string
  color: string
}

const defaultBlocks: BlockItem[] = [
  {
    id: 'b1',
    title: '新人业务岗 30 天培训计划',
    role: '业务岗',
    level: '新人期',
    contents: ['企业文化入门', '业务流程规范', '新人综合考核'],
    duration: '2 门课程 · 1 项测练',
    description: '面向业务新人的完整入职学习包。',
    color: '#185fa5',
  },
  {
    id: 'b2',
    title: '客服岗服务能力提升包',
    role: '客服岗',
    level: '成长期',
    contents: ['客户服务标准', '客服操作手册', '新人综合考核'],
    duration: '2 门课程 · 1 项测练',
    description: '覆盖服务标准与岗位实战能力。',
    color: '#0f6e56',
  },
  {
    id: 'b3',
    title: '全员规章制度必修包',
    role: '职能岗',
    level: '新人期',
    contents: ['规章制度精讲', '新人入职综合考核'],
    duration: '1 门课程 · 1 项测练',
    description: '适用于新员工的制度基础学习。',
    color: '#534ab7',
  },
]

export const useBlockStore = defineStore('block', () => {
  const blocks = ref<BlockItem[]>([...defaultBlocks])

  function getBlockById(id: string) {
    return blocks.value.find((b) => b.id === id)
  }

  return { blocks, getBlockById }
})
