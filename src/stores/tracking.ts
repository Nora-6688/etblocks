import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type TrackingRecord = {
  id: string
  blockName: string
  learner: string
  department: string
  assignedAt: string
  learningHours: number
  completionRate: number
}

const initialRecords: TrackingRecord[] = [
  { id: 'track-1', blockName: '客服岗服务能力提升包', learner: 'Farry', department: '客服部', assignedAt: '2026.08.27 10:30', learningHours: 3.5, completionRate: 75 },
  { id: 'track-2', blockName: '客服岗服务能力提升包', learner: 'Lily', department: '客服部', assignedAt: '2026.08.27 10:30', learningHours: 2, completionRate: 50 },
]

export const useTrackingStore = defineStore('tracking', () => {
  const records = ref<TrackingRecord[]>([...initialRecords])

  const weeklyBlocks = computed(() => [...new Set(records.value.map((record) => record.blockName))])

  function getByBlock(blockName: string) {
    return records.value.filter((record) => record.blockName === blockName)
  }

  function addAssignments(blockName: string, assignedAt: string, learners: { name: string; department: string }[]) {
    learners.forEach((learner) => {
      if (!records.value.some((record) => record.blockName === blockName && record.learner === learner.name)) {
        records.value.unshift({
          id: `${blockName}-${learner.name}-${Date.now()}`,
          blockName,
          learner: learner.name,
          department: learner.department,
          assignedAt,
          learningHours: 0,
          completionRate: 0,
        })
      }
    })
  }

  return { records, weeklyBlocks, getByBlock, addAssignments }
})
