<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useTrackingStore } from '@/stores/tracking'
type Kind = '课程' | '练习题' | '试卷'
type Item = { title: string; kind: Kind; department?: string }
type PushTarget = { name: string; department: string; status: '成功' | '失败'; reason: string }
type PushRecord = { id: number; target: string; deadline: string; pushedAt: string; targets: PushTarget[] }
type Block = {
  name: string
  department: string
  description: string
  items: Item[]
  pushedLearners: { name: string; department: string; deadline: string }[]
  pushRecords: PushRecord[]
}
const name = ref('')
const department = ref('业务部')
const listDepartment = ref('全部部门')
const blockDescription = ref('')
const createDialog = ref(false)
const itemKeyword = ref('')
const itemDepartment = ref('全部部门')
const itemKind = ref('全部类型')
const search = ref('')
const selected = ref<Item[]>([])
const showAssign = ref(false)
const assigningBlock = ref<Block | null>(null)
const pushDepartment = ref('业务部')
const recipientMode = ref<'组织架构' | '指定学员'>('组织架构')
const learnerKeyword = ref('')
const selectedLearners = ref<string[]>([])
const deadline = ref('')
const pushLogVisible = ref(false)
const pushLogBlock = ref<Block | null>(null)
const trackingVisible = ref(false)
const trackingBlock = ref<Block | null>(null)
const retryVisible = ref(false)
const retryLearners = ref<string[]>([])
const learners = [
  { name: 'Tommy', department: '业务部' }, { name: 'Selina', department: '业务部' },
  { name: 'Farry', department: '客服部' }, { name: 'Lily', department: '客服部' },
  { name: 'Solar', department: '商务部' }, { name: 'Vikki', department: '产品部' },
  { name: 'Bling', department: '中后台' },
]
const trackingStore = useTrackingStore()
const organizationLearners = computed(() => pushDepartment.value === '全司不限' ? learners : learners.filter((learner) => learner.department === pushDepartment.value))
const searchedLearners = computed(() => learners.filter((learner) => learner.name.toLowerCase().includes(learnerKeyword.value.trim().toLowerCase()) || learner.department.includes(learnerKeyword.value.trim())))
const options: Item[] = [
  { title: '企业文化入门', kind: '课程', department: '共享' },
  { title: '业务流程规范', kind: '课程', department: '业务部' },
  { title: '客户服务标准', kind: '课程', department: '客服部' },
  { title: '业务流程规范 - 章节测试', kind: '练习题', department: '业务部' },
  { title: '客户服务标准 - 模拟演练', kind: '练习题', department: '客服部' },
  { title: '新人入职综合考核', kind: '试卷', department: '共享' },
]
const filteredOptions = computed(() =>
  options.filter(
    (item) =>
      item.title.includes(itemKeyword.value) &&
      (itemDepartment.value === '全部部门' || item.department === itemDepartment.value) &&
      (itemKind.value === '全部类型' || item.kind === itemKind.value),
  ),
)
const blocks = ref<Block[]>([
  {
    name: '新人业务岗 30 天培训计划',
    department: '业务部',
    description: '面向业务新人的完整入职学习包。',
    items: [
      { title: '企业文化入门', kind: '课程' },
      { title: '业务流程规范 - 章节测试', kind: '练习题' },
    ],
    pushedLearners: [],
    pushRecords: [],
  },
  {
    name: '客服岗服务能力提升包',
    department: '客服部',
    description: '覆盖服务标准与岗位实战能力。',
    items: [
      { title: '客户服务标准', kind: '课程' },
      { title: '新人入职综合考核', kind: '试卷' },
    ],
    pushedLearners: [
      { name: 'Farry', department: '客服部', deadline: '2026.09.30' },
      { name: 'Lily', department: '客服部', deadline: '2026.09.30' },
    ],
    pushRecords: [{ id: 1, target: '客服部', deadline: '2026.09.30', pushedAt: '2026.08.27 10:30', targets: [{ name: 'Farry', department: '客服部', status: '成功', reason: '已送达企业微信，等待学员完成' }, { name: 'Lily', department: '客服部', status: '成功', reason: '已送达企业微信，等待学员完成' }] }],
  },
])
const filteredBlocks = computed(() =>
  blocks.value.filter(
    (block) =>
      block.name.includes(search.value) &&
      (listDepartment.value === '全部部门' || block.department === listDepartment.value),
  ),
)
function add(item: Item) {
  if (!selected.value.some((current) => current.title === item.title)) selected.value.push(item)
}
function remove(item: Item) {
  selected.value = selected.value.filter((current) => current.title !== item.title)
}
function moveItem(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= selected.value.length) return
  const items = [...selected.value]
  const current = items[index]
  const next = items[target]
  if (!current || !next) return
  items[index] = next
  items[target] = current
  selected.value = items
}
function createBlock() {
  if (!name.value) return
  blocks.value.unshift({
    name: name.value,
    department: department.value,
    description: blockDescription.value,
    items: [...selected.value],
    pushedLearners: [],
    pushRecords: [],
  })
  name.value = ''
  blockDescription.value = ''
  selected.value = []
  createDialog.value = false
  ElMessage.success('Blocks 已创建，请确认后手动推送')
}
function openCreateDialog() {
  if (!selected.value.length) {
    ElMessage.warning('请至少添加一项课程或测练')
    return
  }
  createDialog.value = true
}
function confirmAssign() {
  if (!selectedLearners.value.length) {
    ElMessage.warning('请至少添加一位推送对象')
    return
  }
  if (!deadline.value) {
    ElMessage.warning('请选择学习截止时间')
    return
  }
  if (assigningBlock.value) {
    const dl = typeof deadline.value === 'string' ? deadline.value : new Date(deadline.value).toISOString().slice(0, 10).replace(/-/g, '.')
    const targets: PushTarget[] = []
    for (const learnerName of selectedLearners.value) {
      const learner = learners.find((l) => l.name === learnerName)
      if (learner) targets.push({ name: learnerName, department: learner.department, status: learnerName === 'Bling' ? '失败' : '成功', reason: learnerName === 'Bling' ? '企微通知未送达（账号停用）' : '已送达企业微信，等待学员完成' })
      if (learner && !assigningBlock.value.pushedLearners.some((p) => p.name === learnerName)) {
        assigningBlock.value.pushedLearners.push({ name: learnerName, department: learner.department, deadline: dl })
      }
    }
    assigningBlock.value.pushRecords.unshift({ id: Date.now(), target: recipientMode.value === '组织架构' ? pushDepartment.value : `指定 ${targets.length} 人`, deadline: dl, pushedAt: formatNow(), targets })
    trackingStore.addAssignments(assigningBlock.value.name, formatNow(), targets.filter((target) => target.status === '成功'))
  }
  showAssign.value = false
  pushDepartment.value = '业务部'
  learnerKeyword.value = ''
  selectedLearners.value = []
  deadline.value = ''
  assigningBlock.value = null
  ElMessage.success('已完成推送，可在“推送记录”查看结果')
}
function openAssign(block: Block) {
  assigningBlock.value = block
  showAssign.value = true
  pushDepartment.value = block.department
  recipientMode.value = '组织架构'
  learnerKeyword.value = ''
  selectedLearners.value = []
  deadline.value = ''
}
function learnersForDepartment() {
  return organizationLearners.value.map((learner) => learner.name)
}
function toggleAllLearners(checked: boolean) {
  const names = learnersForDepartment()
  selectedLearners.value = checked
    ? [...new Set([...selectedLearners.value, ...names])]
    : selectedLearners.value.filter((name) => !names.includes(name))
}
function addLearner(name: string) {
  if (!selectedLearners.value.includes(name)) selectedLearners.value.push(name)
}
function removeLearner(name: string) {
  selectedLearners.value = selectedLearners.value.filter((item) => item !== name)
}
function formatNow() {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
function openPushLog(block: Block) {
  pushLogBlock.value = block
  pushLogVisible.value = true
}
function openTracking(block: Block) {
  trackingBlock.value = block
  trackingVisible.value = true
}
function openRetry() {
  const failures = pushLogBlock.value?.pushRecords.flatMap((record) => record.targets.filter((target) => target.status === '失败').map((target) => target.name)) ?? []
  retryLearners.value = [...new Set(failures)]
  retryVisible.value = true
}
function retryPush() {
  if (!pushLogBlock.value || !retryLearners.value.length) {
    ElMessage.warning('请至少选择一位学员')
    return
  }
  const targets = retryLearners.value.map((name) => {
    const learner = learners.find((item) => item.name === name)
    return { name, department: learner?.department ?? '-', status: '成功' as const, reason: '重新推送成功，已送达企业微信' }
  })
  pushLogBlock.value.pushRecords.unshift({ id: Date.now(), target: `重新推送 ${targets.length} 人`, deadline: pushLogBlock.value.pushRecords[0]?.deadline ?? '-', pushedAt: formatNow(), targets })
  retryVisible.value = false
  ElMessage.success('已重新推送，可在记录中查看结果')
}
function deleteBlock(block: Block) {
  blocks.value = blocks.value.filter((item) => item !== block)
  ElMessage.success('Blocks 已删除')
}

/* ---------- 编辑 Blocks ---------- */
const editDialog = ref(false)
const editingBlock = ref<Block | null>(null)
const editName = ref('')
const editDepartment = ref('业务部')
const editSelected = ref<Item[]>([])
const editItemKeyword = ref('')
const editItemDepartment = ref('全部部门')
const editItemKind = ref('全部类型')

const editFilteredOptions = computed(() =>
  options.filter(
    (item) =>
      item.title.includes(editItemKeyword.value) &&
      (editItemDepartment.value === '全部部门' || item.department === editItemDepartment.value) &&
      (editItemKind.value === '全部类型' || item.kind === editItemKind.value),
  ),
)

function openEditDialog(block: Block) {
  editingBlock.value = block
  editName.value = block.name
  editDepartment.value = block.department
  editSelected.value = block.items.map((item) => ({ ...item }))
  editItemKeyword.value = ''
  editItemDepartment.value = '全部部门'
  editItemKind.value = '全部类型'
  editDialog.value = true
}

function editAdd(item: Item) {
  if (!editSelected.value.some((current) => current.title === item.title)) {
    editSelected.value.push({ ...item })
  }
}

function editRemove(item: Item) {
  editSelected.value = editSelected.value.filter((current) => current.title !== item.title)
}

function editMoveItem(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= editSelected.value.length) return
  const items = [...editSelected.value]
  const current = items[index]
  const next = items[target]
  if (!current || !next) return
  items[index] = next
  items[target] = current
  editSelected.value = items
}

function saveEditBlock() {
  if (!editingBlock.value) return
  if (!editName.value.trim()) {
    ElMessage.warning('请输入 Blocks 名称')
    return
  }
  if (editSelected.value.length === 0) {
    ElMessage.warning('Blocks 至少保留一项内容')
    return
  }
  editingBlock.value.name = editName.value.trim()
  editingBlock.value.department = editDepartment.value
  editingBlock.value.items = [...editSelected.value]
  editDialog.value = false
  ElMessage.success('Blocks 内容已更新')
}
function icon(dept: string) {
  return dept === '客服部'
    ? '客'
    : dept === '商务部'
      ? '商'
      : dept === '产品部'
        ? '产'
        : dept === '职能部'
          ? '职'
          : dept === '共享'
            ? '共'
            : '业'
}
</script>
<template>
  <section class="heading">
    <div>
      <p>CONTENT COMPOSITION</p>
      <h1>Blocks 创建</h1>
    </div>
    <span>创建后不会自动推送学员</span>
  </section>
  <section class="builder">
    <div class="builder-pane">
      <h2>可选内容</h2>
      <div class="item-filters">
        <el-input v-model="itemKeyword" placeholder="输入关键字筛选" clearable /><el-select
          v-model="itemDepartment"
          placeholder="归属部门"
          ><el-option label="全部部门" value="全部部门" /><el-option
            label="共享"
            value="共享" /><el-option label="业务部" value="业务部" /><el-option
            label="客服部"
            value="客服部" /><el-option label="商务部" value="商务部" /><el-option
            label="产品部"
            value="产品部" /><el-option label="职能部" value="职能部" /></el-select
        ><el-select v-model="itemKind" placeholder="内容类型"
          ><el-option label="全部类型" value="全部类型" /><el-option
            label="课程"
            value="课程" /><el-option label="练习题" value="练习题" /><el-option
            label="试卷"
            value="试卷"
        /></el-select>
      </div>
      <div
        v-for="item in filteredOptions"
        :key="item.title"
        class="option"
        :class="{ chosen: selected.some((current) => current.title === item.title) }"
        @click="add(item)"
      >
        <span class="kind" :class="item.kind">{{ item.kind }}</span
        ><b>{{ item.title }}</b
        ><small>{{
          selected.some((current) => current.title === item.title) ? '已添加' : '+ 添加'
        }}</small>
      </div>
    </div>
    <div class="builder-pane">
      <h2>
        已选内容 <small>{{ selected.length }} 项</small>
      </h2>
      <div v-if="!selected.length" class="empty">点击左侧课程或测练添加</div>
      <div v-for="(item, index) in selected" :key="item.title" class="option">
        <span class="kind" :class="item.kind">{{ item.kind }}</span
        ><b>{{ item.title }}</b
        ><span class="sort-actions"
          ><button title="上移" :disabled="index === 0" @click="moveItem(index, -1)">↑</button
          ><button
            title="下移"
            :disabled="index === selected.length - 1"
            @click="moveItem(index, 1)"
          >
            ↓</button
          ><button @click="remove(item)">移除</button></span
        >
      </div>
    </div>
  </section>
  <section class="create-actions">
    <el-button type="primary" @click="openCreateDialog">创建 Blocks</el-button
    ><el-button @click="selected = []">清空重选</el-button>
  </section>
  <div class="list-heading">
    <h2>已创建 Blocks</h2>
    <div>
      <el-input v-model="search" placeholder="搜索 Blocks" /><el-select v-model="listDepartment"
        ><el-option label="全部部门" value="全部部门" /><el-option
          label="共享"
          value="共享" /><el-option label="业务部" value="业务部" /><el-option
          label="客服部"
          value="客服部" /><el-option label="商务部" value="商务部" /><el-option
          label="产品部"
          value="产品部" /><el-option label="职能部" value="职能部"
      /></el-select>
    </div>
  </div>
  <div class="created-list">
    <article v-for="block in filteredBlocks" :key="block.name">
      <div class="dept">{{ icon(block.department) }}</div>
      <div class="block-main">
        <b>{{ block.name }}</b>
        <p>
          {{ block.department }} · {{ block.items.length }} 项内容<span v-if="block.description">
            · {{ block.description }}</span
          >
        </p>
        <span v-for="item in block.items" :key="item.title" class="mini-kind">{{ item.kind }}</span>
      </div>
      <button @click="openAssign(block)">推送学员</button
      ><button class="push-log" @click="openPushLog(block)">推送记录</button
      ><button @click="openTracking(block)">学习跟踪</button
      ><button @click="openEditDialog(block)">编辑</button
      ><button @click="deleteBlock(block)">删除</button>
    </article>
  </div>
  <el-dialog v-model="createDialog" title="创建 Blocks" width="480px"
    ><el-form label-position="top"
      ><el-form-item label="Blocks 名称"
        ><el-input v-model="name" placeholder="请输入 Blocks 名称" /></el-form-item
      ><el-form-item label="适用部门"
        ><el-select v-model="department" style="width: 100%"
          ><el-option label="共享" value="共享" /><el-option
            label="业务部"
            value="业务部" /><el-option label="客服部" value="客服部" /><el-option
            label="商务部"
            value="商务部" /><el-option label="产品部" value="产品部" /><el-option
            label="职能部"
            value="职能部" /></el-select></el-form-item
      ><el-form-item label="描述（可选）"
        ><el-input
          v-model="blockDescription"
          type="textarea"
          :rows="4"
          placeholder="请输入 Blocks 描述" /></el-form-item></el-form
    ><template #footer
      ><el-button @click="createDialog = false">取消</el-button
      ><el-button type="primary" @click="createBlock">确认创建</el-button></template
    ></el-dialog
  >
  <el-dialog v-model="showAssign" title="推送 Blocks" width="580px" class="assign-dialog"><el-form label-position="top"><el-form-item label="添加方式"><div class="recipient-tabs"><button type="button" :class="{ active: recipientMode === '组织架构' }" @click="recipientMode = '组织架构'">从部门架构添加</button><button type="button" :class="{ active: recipientMode === '指定学员' }" @click="recipientMode = '指定学员'">指定学员</button></div></el-form-item><template v-if="recipientMode === '组织架构'"><el-form-item label="推送部门"><el-select v-model="pushDepartment" style="width:100%"><el-option label="业务部" value="业务部"/><el-option label="客服部" value="客服部"/><el-option label="商务部" value="商务部"/><el-option label="产品部" value="产品部"/><el-option label="中后台" value="中后台"/><el-option label="全司不限" value="全司不限"/></el-select></el-form-item><el-form-item label="推送对象"><div class="learner-picker"><el-checkbox :model-value="learnersForDepartment().every((name) => selectedLearners.includes(name))" @change="toggleAllLearners">全选{{ pushDepartment }}</el-checkbox><div class="learner-options"><button v-for="learner in organizationLearners" :key="learner.name" type="button" class="learner-option" :class="{ added: selectedLearners.includes(learner.name) }" @click="addLearner(learner.name)"><span>{{ learner.name }}<small>{{ learner.department }}</small></span><b>{{ selectedLearners.includes(learner.name) ? '已添加' : '+' }}</b></button></div></div></el-form-item></template><template v-else><el-form-item label="搜索系统内学员"><el-input v-model="learnerKeyword" placeholder="输入姓名或部门搜索" clearable /></el-form-item><div class="search-results"><button v-for="learner in searchedLearners" :key="learner.name" type="button" class="learner-option" :class="{ added: selectedLearners.includes(learner.name) }" @click="addLearner(learner.name)"><span>{{ learner.name }}<small>{{ learner.department }}</small></span><b>{{ selectedLearners.includes(learner.name) ? '已添加' : '+' }}</b></button></div></template><el-form-item label="已选推送对象"><div class="selected-recipients"><span v-if="!selectedLearners.length" class="placeholder">尚未添加学员</span><span v-for="learner in selectedLearners" :key="learner" class="recipient-chip">{{ learner }}<button type="button" @click="removeLearner(learner)">×</button></span></div></el-form-item><el-form-item label="学习截止时间"><el-date-picker v-model="deadline" type="date" style="width:100%" placeholder="选择截止日期"/></el-form-item></el-form><template #footer><el-button @click="showAssign = false">取消</el-button><el-button type="primary" @click="confirmAssign">确认推送</el-button></template></el-dialog>
  <el-dialog v-model="pushLogVisible" :title="`推送记录 - ${pushLogBlock?.name ?? ''}`" width="760px" class="push-log-dialog"><div v-if="!pushLogBlock?.pushRecords.length" class="empty">该 Blocks 暂无推送记录</div><section v-for="record in pushLogBlock?.pushRecords" :key="record.id" class="push-record"><div class="record-head"><span><strong>{{ record.pushedAt }}</strong>　{{ record.target }}　截止 {{ record.deadline }}</span><span><b class="success-text">成功 {{ record.targets.filter((target) => target.status === '成功').length }}</b>　<b class="fail-text">失败 {{ record.targets.filter((target) => target.status === '失败').length }}</b></span></div><table><thead><tr><th>姓名</th><th>部门</th><th>推送状态</th><th>说明</th></tr></thead><tbody><tr v-for="target in record.targets" :key="target.name"><td>{{ target.name }}</td><td>{{ target.department }}</td><td><b class="delivery-status" :class="target.status === '成功' ? 'success' : 'fail'">{{ target.status }}</b></td><td>{{ target.reason }}</td></tr></tbody></table></section><template #footer><el-button @click="pushLogVisible = false">关闭</el-button><el-button type="primary" @click="openRetry">重新推送</el-button></template></el-dialog>
  <el-dialog v-model="retryVisible" title="重新推送" width="460px"><el-form label-position="top"><el-form-item label="选择学员"><el-checkbox-group v-model="retryLearners" class="retry-list"><el-checkbox v-for="learner in learners" :key="learner.name" :label="learner.name">{{ learner.name }} <small>{{ learner.department }}</small></el-checkbox></el-checkbox-group></el-form-item></el-form><template #footer><el-button @click="retryVisible = false">取消</el-button><el-button type="primary" @click="retryPush">确认重新推送</el-button></template></el-dialog>
  <el-dialog v-model="trackingVisible" :title="`学习跟踪 - ${trackingBlock?.name ?? ''}`" width="720px"><div v-if="trackingBlock" class="tracking-summary"><span>已指派 {{ trackingStore.getByBlock(trackingBlock.name).length }} 人</span><span>平均完成率 {{ Math.round(trackingStore.getByBlock(trackingBlock.name).reduce((sum, record) => sum + record.completionRate, 0) / Math.max(trackingStore.getByBlock(trackingBlock.name).length, 1)) }}%</span></div><div v-if="!trackingBlock || !trackingStore.getByBlock(trackingBlock.name).length" class="empty">该 Blocks 暂无学习记录</div><table v-else class="tracking-table"><thead><tr><th>学员</th><th>部门</th><th>指派时间</th><th>学习时长</th><th>完成率</th></tr></thead><tbody><tr v-for="record in trackingStore.getByBlock(trackingBlock.name)" :key="record.id"><td>{{ record.learner }}</td><td>{{ record.department }}</td><td>{{ record.assignedAt }}</td><td>{{ record.learningHours }} 小时</td><td><div class="completion"><i :style="{ width: record.completionRate + '%' }"></i><span>{{ record.completionRate }}%</span></div></td></tr></tbody></table></el-dialog>
  <el-dialog v-model="editDialog" title="编辑 Blocks" width="780px" class="edit-dialog"
    ><div v-if="editingBlock" class="edit-body">
      <div class="edit-info">
        <el-input v-model="editName" placeholder="请输入 Blocks 名称" class="edit-name-input" /><el-select
          v-model="editDepartment"
          class="edit-dept-select"
          ><el-option label="共享" value="共享" /><el-option
            label="业务部"
            value="业务部" /><el-option label="客服部" value="客服部" /><el-option
            label="商务部"
            value="商务部" /><el-option label="产品部" value="产品部" /><el-option
            label="职能部"
            value="职能部" /></el-select
        >
      </div>
      <div class="edit-grid">
        <div class="edit-pane">
          <h3>可选内容</h3>
          <div class="item-filters">
            <el-input v-model="editItemKeyword" placeholder="输入关键字筛选" clearable /><el-select
              v-model="editItemDepartment"
              placeholder="归属部门"
              ><el-option label="全部部门" value="全部部门" /><el-option
                label="共享"
                value="共享" /><el-option label="业务部" value="业务部" /><el-option
                label="客服部"
                value="客服部" /><el-option label="商务部" value="商务部" /><el-option
                label="产品部"
                value="产品部" /><el-option label="职能部" value="职能部" /></el-select
            ><el-select v-model="editItemKind" placeholder="内容类型"
              ><el-option label="全部类型" value="全部类型" /><el-option
                label="课程"
                value="课程" /><el-option label="练习题" value="练习题" /><el-option
                label="试卷"
                value="试卷"
            /></el-select>
          </div>
          <div class="edit-options-scroll">
            <div
              v-for="item in editFilteredOptions"
              :key="item.title"
              class="option"
              :class="{ chosen: editSelected.some((c) => c.title === item.title) }"
              @click="editAdd(item)"
            >
              <span class="kind" :class="item.kind">{{ item.kind }}</span><b>{{ item.title }}</b
              ><small>{{
                editSelected.some((c) => c.title === item.title) ? '已添加' : '+ 添加'
              }}</small>
            </div>
            <div v-if="!editFilteredOptions.length" class="empty">无匹配内容</div>
          </div>
        </div>
        <div class="edit-pane">
          <h3>
            已选内容 <small>{{ editSelected.length }} 项</small>
          </h3>
          <div class="edit-selected-scroll">
            <div v-if="!editSelected.length" class="empty">至少保留一项内容</div>
            <div v-for="(item, index) in editSelected" :key="item.title" class="option">
              <span class="kind" :class="item.kind">{{ item.kind }}</span><b>{{ item.title }}</b
              ><span class="sort-actions"
                ><button title="上移" :disabled="index === 0" @click="editMoveItem(index, -1)"
                  >↑</button
                ><button
                  title="下移"
                  :disabled="index === editSelected.length - 1"
                  @click="editMoveItem(index, 1)"
                  >↓</button
                ><button @click="editRemove(item)">移除</button></span
              >
            </div>
          </div>
        </div>
      </div>
      <div class="edit-learners">
        <h3>已推送学员名单 <small v-if="editingBlock.pushedLearners.length">{{ editingBlock.pushedLearners.length }} 人</small></h3>
        <el-table :data="editingBlock.pushedLearners" border stripe size="small" style="width: 100%"
          ><el-table-column prop="name" label="姓名" width="120" /><el-table-column
            prop="department"
            label="部门"
            width="140" /><el-table-column prop="deadline" label="截止时间" /></el-table
        >
      </div>
    </div>
    <template #footer
      ><el-button @click="editDialog = false">取消</el-button
      ><el-button type="primary" @click="saveEditBlock">保存修改</el-button></template
    ></el-dialog
  >
</template>
<style scoped>
.heading,
.list-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  margin-bottom: 20px;
}
.heading p,
.list-heading h2 {
  color: var(--teal);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
}
.heading h1 {
  font-size: 22px;
  margin-top: 5px;
}
.heading > span {
  color: var(--muted);
  font-size: 12px;
}
.builder {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 14px;
}
.builder-pane,
.create-actions,
.created-list {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
}
.builder-pane {
  padding: 18px;
  min-height: 260px;
}
.builder-pane h2 {
  font-size: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 7px;
}
.builder-pane h2 small {
  color: var(--muted);
  font-size: 11px;
  font-weight: 400;
}
.item-filters {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 7px;
  margin-bottom: 9px;
}
.item-filters .el-input,
.item-filters .el-select {
  min-width: 0;
}
.option {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 7px;
  border-bottom: 1px solid #f1f3f5;
  cursor: pointer;
  font-size: 12px;
}
.option:hover,
.option.chosen {
  background: var(--mint);
}
.option b {
  flex: 1;
  font-weight: 500;
}
.option small,
.option button {
  border: 0;
  background: transparent;
  color: var(--teal);
  font-size: 11px;
}
.kind,
.mini-kind {
  padding: 3px 6px;
  background: var(--mint);
  color: var(--teal);
  font-size: 10px;
}
.kind.练习题,
.mini-kind:nth-child(2) {
  background: #eeedfe;
  color: #534ab7;
}
.kind.试卷,
.mini-kind:nth-child(3) {
  background: #faeeda;
  color: #b45309;
}
.empty {
  display: grid;
  place-items: center;
  height: 180px;
  color: var(--muted);
  font-size: 12px;
}
.create-actions {
  display: flex;
  gap: 9px;
  margin-bottom: 23px;
}
.sort-actions {
  display: flex;
  align-items: center;
  gap: 3px;
}
.sort-actions button {
  min-width: 22px;
  padding: 2px 4px;
}
.sort-actions button:disabled {
  color: #cbd5df;
  cursor: not-allowed;
}
.learner-picker {
  display: grid;
  gap: 9px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  background: #fafcfe;
}
.learner-picker :deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
}
.recipient-tabs { display: flex; width: 100%; border-bottom: 1px solid var(--line); }
.recipient-tabs button { padding: 9px 15px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--muted); cursor: pointer; font-size: 12px; }
.recipient-tabs button.active { border-bottom-color: var(--teal); color: var(--teal); font-weight: 600; }
.learner-options, .search-results { display: grid; grid-template-columns: repeat(2, 1fr); gap: 7px; margin-top: 10px; }
.learner-option { display: flex; align-items: center; justify-content: space-between; min-height: 43px; padding: 7px 10px; border: 1px solid var(--line); border-radius: 6px; background: #fff; color: var(--ink); text-align: left; cursor: pointer; font-size: 12px; }
.learner-option:hover { border-color: var(--teal); }.learner-option.added { border-color: #b8d7f1; background: var(--mint); color: var(--teal); }
.learner-option span { display: grid; gap: 1px; }.learner-option small { color: var(--muted); font-size: 10px; }.learner-option b { display: grid; place-items: center; min-width: 20px; height: 20px; border-radius: 50%; background: var(--mint); color: var(--teal); font-size: 15px; }.learner-option.added b { width: auto; border-radius: 0; background: transparent; font-size: 10px; font-weight: 500; }
.search-results { max-height: 160px; overflow: auto; margin: -7px 0 17px; padding: 8px; border: 1px solid var(--line); background: #fafcfe; }
.selected-recipients { display: flex; min-height: 42px; align-items: center; flex-wrap: wrap; gap: 7px; padding: 8px; border: 1px solid var(--line); background: #fafcfe; }.placeholder { color: #9ca3af; font-size: 12px; }.recipient-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 8px; border-radius: 4px; background: var(--mint); color: var(--teal); font-size: 11px; }.recipient-chip button { border: 0; background: transparent; color: var(--teal); cursor: pointer; font-size: 14px; line-height: 1; }
.list-heading {
  align-items: center;
}
.list-heading h2 {
  color: var(--ink);
  font-size: 16px;
  letter-spacing: 0;
}
.list-heading > div {
  display: flex;
  gap: 8px;
}
.list-heading .el-input {
  width: 180px;
}
.created-list {
  overflow: hidden;
}
.created-list article {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-bottom: 1px solid #edf1f5;
}
.created-list article:last-child {
  border: 0;
}
.dept {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--teal);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}
.block-main {
  flex: 1;
}
.block-main > b {
  font-size: 13px;
}
.block-main p {
  color: var(--muted);
  font-size: 11px;
  margin: 3px 0 7px;
}
.mini-kind {
  margin-right: 5px;
  font-size: 9px;
}
.created-list button {
  border: 0;
  background: transparent;
  color: var(--teal);
  cursor: pointer;
  font-size: 11px;
}
.push-record { overflow: hidden; margin-bottom: 14px; border: 1px solid var(--line); border-radius: 8px; }
.push-record:last-child { margin-bottom: 0; }
.record-head { display: flex; align-items: center; gap: 18px; padding: 12px 15px; background: #fafcfe; color: var(--muted); font-size: 11px; }
.record-head strong { color: var(--ink); font-size: 13px; }
.record-head > span:last-child { margin-left: auto; }
.success-text { color: #0f6e56; font-weight: 600; }
.fail-text { color: #a32d2d; font-weight: 600; }
.push-record table { width: 100%; min-width: 0; border-collapse: collapse; }
.push-record th, .push-record td { padding: 10px 15px; border-top: 1px solid var(--line); color: var(--muted); font-size: 11px; text-align: left; }
.push-record th { background: #fff; font-weight: 500; }
.delivery-status { display: inline-block; padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: 500; }
.delivery-status.success { background: #e1f5ee; color: #0f6e56; }
.delivery-status.fail { background: #fcebeb; color: #a32d2d; }
.retry-list { display: grid; gap: 10px; padding: 12px; border: 1px solid var(--line); border-radius: 8px; background: #fafcfe; }
.retry-list :deep(.el-checkbox__label) { color: var(--ink); font-size: 13px; }
.retry-list small { color: var(--muted); font-size: 11px; }
.tracking-summary { display: flex; gap: 12px; margin-bottom: 16px; }.tracking-summary span { padding: 6px 10px; border-radius: 5px; background: var(--mint); color: var(--teal); font-size: 12px; }.tracking-table { width: 100%; border-collapse: collapse; }.tracking-table th, .tracking-table td { padding: 12px 14px; border-bottom: 1px solid var(--line); text-align: left; font-size: 12px; }.tracking-table th { color: var(--muted); background: #fafcfe; font-weight: 500; }.completion { display: flex; align-items: center; gap: 8px; width: 140px; height: 6px; background: #e9eef3; }.completion i { display: block; height: 6px; background: var(--teal); }.completion span { min-width: 32px; margin-left: 6px; color: var(--teal); font-size: 11px; }
/* ---------- 编辑 Blocks 对话框 ---------- */
.edit-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 16px;
}
.edit-info .edit-name-input {
  flex: 1;
}
.edit-info .edit-dept-select {
  width: 130px;
  flex-shrink: 0;
}
.edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}
.edit-pane {
  background: #fafcfe;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
}
.edit-pane h3 {
  font-size: 13px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 8px;
}
.edit-pane h3 small {
  color: var(--muted);
  font-size: 11px;
  font-weight: 400;
}
.edit-options-scroll,
.edit-selected-scroll {
  max-height: 280px;
  overflow-y: auto;
}
.edit-learners h3 {
  font-size: 13px;
  margin-bottom: 10px;
}
.edit-learners h3 small {
  color: var(--muted);
  font-size: 11px;
  font-weight: 400;
}
@media (max-width: 700px) {
  .builder {
    grid-template-columns: 1fr;
  }
  .item-filters {
    grid-template-columns: 1fr;
  }
  .learner-options, .search-results { grid-template-columns: 1fr; }
  .create-actions,
  .list-heading,
  .list-heading > div {
    flex-wrap: wrap;
  }
  .list-heading .el-input {
    min-width: 100%;
    width: 100%;
  }
  .created-list article {
    flex-wrap: wrap;
  }
  .block-main {
    min-width: calc(100% - 55px);
  }
  .status {
    margin-left: 54px;
  }
  .edit-grid {
    grid-template-columns: 1fr;
  }
}
</style>
