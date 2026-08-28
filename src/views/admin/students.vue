<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref } from 'vue'
import * as XLSX from 'xlsx'

type Student = {
  name: string
  phone: string
  email: string
  department: string
  role: string
  workId: string
  joined: string
  completed: string
  progress: string
  status: string
  password: string
  source: string
  evaluation: string
}

const students = ref<Student[]>([
  { name: 'Bling', phone: '13800001111', email: 'bling@ford.com', department: '中后台', role: '人力总监', workId: 'HR001', joined: '2020.06.18', completed: '6/8', progress: '75%', status: '已关闭', password: '', source: '手动添加', evaluation: '' },
  { name: 'Tommy', phone: '13800002222', email: 'tommy@ford.com', department: '业务部', role: '业务总监', workId: 'BD001', joined: '2022.03.12', completed: '12/15', progress: '80%', status: '已开通', password: '', source: '手动添加', evaluation: '学习主动性强，业务流程掌握扎实，建议加强客户沟通技巧。' },
  { name: 'Farry', phone: '13800003333', email: 'farry@ford.com', department: '客服部', role: '文件支持', workId: 'CS001', joined: '2023.05.20', completed: '5/10', progress: '50%', status: '已关闭', password: '', source: '手动添加', evaluation: '' },
  { name: 'Vikki', phone: '13800004444', email: 'vikki@ford.com', department: '产品部', role: '产品经理', workId: 'PD001', joined: '2021.08.01', completed: '18/20', progress: '90%', status: '已关闭', password: '', source: '手动添加', evaluation: '' },
  { name: 'Selina', phone: '13800005555', email: 'selina@ford.com', department: '业务部', role: '客户经理', workId: 'BD002', joined: '2024.11.16', completed: '8/12', progress: '67%', status: '已开通', password: '', source: '手动添加', evaluation: '课程完成情况良好。' },
  { name: 'Solar', phone: '13800006666', email: 'solar@ford.com', department: '商务部', role: '商务专员', workId: 'CM001', joined: '2023.09.08', completed: '7/12', progress: '58%', status: '已开通', password: '', source: '手动添加', evaluation: '' },
  { name: 'Lily', phone: '13800007777', email: 'lily@ford.com', department: '客服部', role: '客服专员', workId: 'CS002', joined: '2025.01.15', completed: '3/10', progress: '30%', status: '已开通', password: '', source: '手动添加', evaluation: '' },
])

const keyword = ref('')
const department = ref('全部部门')
const statusFilter = ref('全部状态')
const filteredStudents = computed(() =>
  students.value.filter(
    (student) =>
      student.name.includes(keyword.value) &&
      (department.value === '全部部门' || student.department === department.value) &&
      (statusFilter.value === '全部状态' || student.status === statusFilter.value),
  ),
)

const review = ref('')
const reviewStudent = ref('')
const reviewVisible = ref(false)
function saveReview() {
  const student = students.value.find((item) => item.name === reviewStudent.value)
  if (student) student.evaluation = review.value
  reviewVisible.value = false
  ElMessage.success(`已保存 ${reviewStudent.value} 的学习评价`)
}
function togglePermission(student: Student) {
  student.status = student.status === '已开通' ? '已关闭' : '已开通'
  ElMessage.success(`${student.name}账号已${student.status}`)
}
async function removeStudent(student: Student) {
  await ElMessageBox.confirm(`确定移除学员"${student.name}"吗？`, '移除学员', { type: 'warning' })
  students.value = students.value.filter((item) => item !== student)
  ElMessage.success(`${student.name} 已移除`)
}
function openReview(student: Student) {
  reviewStudent.value = student.name
  review.value = student.evaluation
  reviewVisible.value = true
}

/* ---------- 添加学员 ---------- */
const addModeVisible = ref(false)
const manualAddVisible = ref(false)
const batchImportVisible = ref(false)
const syncPageVisible = ref(false)

function openAddMode() { addModeVisible.value = true }
function chooseAddMode(mode: string) {
  addModeVisible.value = false
  if (mode === '手动添加') manualAddVisible.value = true
  else if (mode === '批量导入') batchImportVisible.value = true
  else if (mode === '第三方同步') syncPageVisible.value = true
}

/* ---------- 手动添加 ---------- */
const defaultPassword = 'Ford@2026'
const newStudent = ref({
  name: '',
  phone: '',
  email: '',
  department: '业务部',
  role: '',
  workId: '',
  useDefaultPassword: true,
  customPassword: '',
})

function resetNewStudent() {
  newStudent.value = { name: '', phone: '', email: '', department: '业务部', role: '', workId: '', useDefaultPassword: true, customPassword: '' }
}

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'
  let pwd = ''
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  return pwd
}

function submitManualAdd() {
  if (!newStudent.value.name.trim()) { ElMessage.warning('请输入姓名'); return }
  if (!newStudent.value.email.trim()) { ElMessage.warning('请输入邮箱'); return }
  const pwd = newStudent.value.useDefaultPassword ? defaultPassword : (newStudent.value.customPassword || generatePassword())
  const student: Student = {
    name: newStudent.value.name,
    phone: newStudent.value.phone || '未填写',
    email: newStudent.value.email,
    department: newStudent.value.department,
    role: newStudent.value.role || '未填写',
    workId: newStudent.value.workId || `EMP${Date.now().toString().slice(-6)}`,
    joined: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    completed: '0/0',
    progress: '0%',
    status: '已开通',
    password: pwd,
    source: '手动添加',
    evaluation: '',
  }
  students.value.unshift(student)
  ElMessageBox.alert(
    `学员 ${student.name} 账号已创建\n初始密码：${pwd}\n${student.phone !== '未填写' ? '密码将通过短信发送给学员' : '密码将通过邮件发送给学员'}\n学员可在登录页面自行修改密码`,
    '账号创建成功',
    { confirmButtonText: '知道了', type: 'success' },
  )
  resetNewStudent()
  manualAddVisible.value = false
}

/* ---------- 批量导入 ---------- */
const excelPreviewStudents = ref<{ name: string; phone: string; department: string; role: string; workId: string }[]>([])
const studentTemplateHeader = ['姓名', '手机号', '邮箱', '所属部门', '岗位', '工号']

function downloadStudentTemplate() {
  const sample = [
    ['张三', '13800008888', 'zhangsan@ford.com', '业务部', '客户经理', 'BD010'],
    ['李四', '13800009999', 'lisi@ford.com', '客服部', '客服专员', 'CS010'],
    ['王五', '13800001010', 'wangwu@ford.com', '产品部', '产品助理', 'PD010'],
  ]
  const aoa = [studentTemplateHeader, ...sample]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = studentTemplateHeader.map(() => ({ wch: 18 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '学员模板')
  XLSX.writeFile(wb, '学员导入模板.xlsx')
  ElMessage.success('模板已下载')
}

function handleStudentUpload(file: { raw: File }) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const sheetName = wb.SheetNames[0]
      if (!sheetName) { ElMessage.warning('文件中没有工作表'); return }
      const ws = wb.Sheets[sheetName]
      if (!ws) { ElMessage.warning('工作表为空'); return }
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
      if (!rows.length) { ElMessage.warning('文件中没有数据'); return }
      excelPreviewStudents.value = rows.map((row) => ({
        name: (row['姓名'] || '').trim(),
        phone: (row['手机号'] || '').trim(),
        department: (row['所属部门'] || '业务部').trim(),
        role: (row['岗位'] || '').trim(),
        workId: (row['工号'] || '').trim(),
      })).filter((r) => r.name)
      ElMessage.success(`已解析 ${excelPreviewStudents.value.length} 条学员数据，请确认后导入`)
    } catch {
      ElMessage.error('文件解析失败，请检查格式是否正确')
    }
  }
  reader.readAsArrayBuffer(file.raw)
}

function confirmStudentImport() {
  let imported = 0
  for (const row of excelPreviewStudents.value) {
    const student: Student = {
      name: row.name,
      phone: row.phone || '未填写',
      email: '未填写',
      department: row.department || '业务部',
      role: row.role || '未填写',
      workId: row.workId || `EMP${Date.now().toString().slice(-6)}`,
      joined: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      completed: '0/0',
      progress: '0%',
      status: '已开通',
      password: defaultPassword,
      source: '批量导入',
      evaluation: '',
    }
    students.value.unshift(student)
    imported++
  }
  batchImportVisible.value = false
  excelPreviewStudents.value = []
  ElMessage.success(`成功导入 ${imported} 名学员，初始密码为 ${defaultPassword}`)
}

/* ---------- 第三方同步（企业微信） ---------- */
const wecomAuthorized = ref(false)
const wecomSyncLoading = ref(false)
const wecomLastSync = ref('')
const wecomSyncRange = ref<'full' | 'department'>('full')
const wecomSelectedDepts = ref<string[]>([])
const wecomDeptOptions = ['业务部', '客服部', '商务部', '产品部', '职能部', '中后台']

function authorizeWecom() {
  ElMessageBox.confirm(
    '即将跳转至企业微信授权页面，授权后系统可读取组织架构和成员信息。是否继续？',
    '企业微信授权',
    { confirmButtonText: '立即授权', cancelButtonText: '取消', type: 'info' },
  ).then(() => {
    wecomAuthorized.value = true
    ElMessage.success('企业微信授权成功，已获取组织架构读取权限')
  }).catch(() => {})
}

function syncWecom() {
  if (!wecomAuthorized.value) return
  if (wecomSyncRange.value === 'department' && wecomSelectedDepts.value.length === 0) {
    ElMessage.warning('请至少选择一个部门')
    return
  }
  wecomSyncLoading.value = true
  setTimeout(() => {
    const syncCount = wecomSyncRange.value === 'full' ? 3 : wecomSelectedDepts.value.length
    const names = wecomSyncRange.value === 'full'
      ? ['赵六', '孙七', '周八']
      : ['赵六', '孙七', '周八'].slice(0, syncCount)
    const depts = wecomSyncRange.value === 'full'
      ? ['业务部', '客服部', '产品部']
      : wecomSelectedDepts.value
    names.forEach((name, i) => {
      const student: Student = {
        name,
        phone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        email: `${name.toLowerCase()}@ford.com`,
        department: depts[i % depts.length] || '业务部',
        role: '同步导入',
        workId: `WX${Date.now().toString().slice(-6)}${i}`,
        joined: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
        completed: '0/0',
        progress: '0%',
        status: '已开通',
        password: '',
        source: '企业微信同步',
        evaluation: '',
      }
      students.value.unshift(student)
    })
    wecomSyncLoading.value = false
    wecomLastSync.value = new Date().toLocaleString('zh-CN')
    ElMessage.success(`同步完成，新增 ${names.length} 名学员，账号已自动创建`)
    syncPageVisible.value = false
  }, 1500)
}
</script>

<template>
  <section class="page-heading">
    <div>
      <p class="eyebrow">PEOPLE & ACCESS</p>
      <h1>学员管理</h1>
      <p>管理员工身份、学习权限与培训进度。</p>
    </div>
    <div class="actions">
      <el-button type="primary" @click="openAddMode">＋ 添加学员</el-button>
    </div>
  </section>
  <div class="stats">
    <div><small>全部学员</small><strong>{{ students.length }}</strong></div>
    <div><small>本月活跃</small><strong>96</strong></div>
    <div class="pending-stat"><small>待开通</small><strong>{{ students.filter(s => s.status === '已关闭').length }}</strong></div>
  </div>
  <div class="table-wrap">
    <div class="table-tools">
      <el-input v-model="keyword" placeholder="搜索姓名" /><el-select v-model="department"
        ><el-option label="全部部门" value="全部部门" /><el-option
          label="业务部" value="业务部" /><el-option label="客服部" value="客服部" /><el-option
          label="产品部" value="产品部" /><el-option label="商务部" value="商务部" /><el-option
          label="中后台" value="中后台"
      /></el-select>
      <el-select v-model="statusFilter"
        ><el-option label="全部状态" value="全部状态" /><el-option
          label="已开通" value="已开通" /><el-option label="已关闭" value="已关闭"
      /></el-select>
    </div>
    <table>
      <thead>
        <tr>
          <th>姓名</th>
          <th>部门</th>
          <th>岗位</th>
          <th>工号</th>
          <th>入职时间</th>
          <th>已完成课程</th>
          <th>平均完成率</th>
          <th>来源</th>
          <th>权限状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="student in filteredStudents" :key="student.name + student.workId">
          <td>
            <div class="student">
              <span>{{ student.name.slice(0, 1) }}</span><strong>{{ student.name }}</strong>
            </div>
          </td>
          <td>{{ student.department }}</td>
          <td>{{ student.role }}</td>
          <td>{{ student.workId }}</td>
          <td>{{ student.joined }}</td>
          <td>{{ student.completed }}</td>
          <td>
            <div class="progress"><i :style="{ width: student.progress }"></i></div>
            <small>{{ student.progress }}</small>
          </td>
          <td><span class="source-tag" :class="{ sync: student.source === '企业微信同步', batch: student.source === '批量导入' }">{{ student.source }}</span></td>
          <td>
            <button class="permission-switch" :class="{ on: student.status === '已开通' }" @click="togglePermission(student)">
              <i></i>
            </button>
          </td>
          <td class="actions">
            <button class="action-primary" @click="openReview(student)">评价</button>
            <button v-if="student.source !== '企业微信同步'" class="action-remove" @click="removeStudent(student)">移除</button>
            <span v-else class="sync-locked" title="企业微信同步的学员会跟随通讯录自动增减，无需手动移除">同步管理</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 学习评价对话框 -->
  <el-dialog v-model="reviewVisible" :title="`学习评价 - ${reviewStudent}`" width="590px" @close="reviewStudent = ''">
    <p class="review-name">评价内容（可输入文字）</p>
    <el-input v-model="review" type="textarea" :rows="4" placeholder="例如：学习主动性强，业务流程掌握扎实，建议加强客户沟通技巧..." />
    <template #footer>
      <div class="review-tip">提示：接入企业微信后，学员成绩与学习评价可一键推送给指定接收人（如学员的直属上级）。</div>
      <div class="review-actions">
        <el-button type="primary" class="save-review" @click="saveReview">保存评价</el-button>
        <el-button class="push-review" :disabled="!review" @click="ElMessage.info('接入企业微信后可推送给学员上级')">推送上级</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 添加学员方式选择 -->
  <el-dialog v-model="addModeVisible" title="添加学员" width="420px">
    <p class="dialog-copy">选择添加方式</p>
    <div class="mode-options">
      <button type="button" @click="chooseAddMode('手动添加')"><b>手动添加</b><span>逐个填写姓名、手机号、部门等信息</span></button>
      <button type="button" @click="chooseAddMode('批量导入')"><b>批量导入</b><span>下载模板，填写后上传 Excel 批量创建</span></button>
      <button type="button" @click="chooseAddMode('第三方同步')"><b>第三方同步</b><span>从企业微信同步组织架构，自动创建账号</span></button>
    </div>
  </el-dialog>

  <!-- 手动添加表单 -->
  <el-dialog v-model="manualAddVisible" title="手动添加学员" width="520px">
    <el-form label-position="top">
      <el-form-item label="姓名" required><el-input v-model="newStudent.name" placeholder="请输入姓名" /></el-form-item>
      <div class="form-row2">
        <el-form-item label="手机号（选填）"><el-input v-model="newStudent.phone" placeholder="选填" /></el-form-item>
        <el-form-item label="邮箱" required><el-input v-model="newStudent.email" placeholder="请输入邮箱" /></el-form-item>
      </div>
      <p class="form-hint">邮箱用于发送账号密码通知，手机号为选填</p>
      <div class="form-row2">
        <el-form-item label="所属部门"><el-select v-model="newStudent.department" style="width:100%"><el-option v-for="d in ['业务部','客服部','商务部','产品部','职能部','中后台']" :key="d" :label="d" :value="d" /></el-select></el-form-item>
        <el-form-item label="岗位"><el-input v-model="newStudent.role" placeholder="请输入岗位" /></el-form-item>
      </div>
      <el-form-item label="工号"><el-input v-model="newStudent.workId" placeholder="留空则系统自动生成" /></el-form-item>
      <el-form-item label="初始密码设置">
        <div class="password-config">
          <el-radio-group v-model="newStudent.useDefaultPassword">
            <el-radio :label="true">统一默认密码（{{ defaultPassword }}）</el-radio>
            <el-radio :label="false">自定义密码</el-radio>
          </el-radio-group>
          <el-input v-if="!newStudent.useDefaultPassword" v-model="newStudent.customPassword" placeholder="请输入自定义密码" style="margin-top:8px" />
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="manualAddVisible = false">取消</el-button>
      <el-button type="primary" @click="submitManualAdd">创建账号</el-button>
    </template>
  </el-dialog>

  <!-- 批量导入 -->
  <el-dialog v-model="batchImportVisible" title="批量导入学员" width="560px">
    <div class="excel-import">
      <div class="import-step">
        <p class="step-label"><b>① 下载学员模板</b></p>
        <p class="step-desc">下载标准模板，按格式填写学员信息</p>
        <el-button type="primary" plain @click="downloadStudentTemplate">下载学员模板</el-button>
      </div>
      <div class="import-step">
        <p class="step-label"><b>② 上传填写好的学员表</b></p>
        <p class="step-desc">支持 .xlsx / .xls 格式，初始密码统一为 {{ defaultPassword }}</p>
        <el-upload :auto-upload="false" :show-file-list="false" accept=".xlsx,.xls" :on-change="handleStudentUpload">
          <el-button type="primary">选择文件</el-button>
        </el-upload>
      </div>
      <div v-if="excelPreviewStudents.length" class="import-step">
        <p class="step-label"><b>③ 预览确认</b></p>
        <p class="step-desc">已解析 {{ excelPreviewStudents.length }} 条数据，确认无误后点击导入</p>
        <div class="preview-table">
          <table><thead><tr><th>姓名</th><th>手机号</th><th>部门</th><th>岗位</th><th>工号</th></tr></thead><tbody>
            <tr v-for="(row, i) in excelPreviewStudents.slice(0, 5)" :key="i"><td>{{ row.name }}</td><td>{{ row.phone }}</td><td>{{ row.department }}</td><td>{{ row.role }}</td><td>{{ row.workId }}</td></tr>
          </tbody></table>
          <p v-if="excelPreviewStudents.length > 5" class="more-tip">仅显示前 5 条，共 {{ excelPreviewStudents.length }} 条</p>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="batchImportVisible = false">取消</el-button>
      <el-button type="primary" :disabled="!excelPreviewStudents.length" @click="confirmStudentImport">导入学员</el-button>
    </template>
  </el-dialog>

  <!-- 第三方同步（企业微信） -->
  <el-dialog v-model="syncPageVisible" title="第三方同步 - 企业微信" width="600px">
    <div class="sync-content">
      <template v-if="!wecomAuthorized">
        <div class="sync-authorize">
          <div class="sync-icon">企</div>
          <h3>企业微信</h3>
          <p class="sync-desc">授权后可同步企业微信组织架构，自动创建学员账号，免去手动添加。</p>
          <el-button type="primary" size="large" @click="authorizeWecom">立即授权</el-button>
          <p class="sync-hint">授权后将获取：通讯录读取权限、成员信息读取权限</p>
        </div>
      </template>
      <template v-else>
        <div class="sync-status">
          <div class="sync-status-head">
            <span class="sync-badge authorized">已授权</span>
            <span v-if="wecomLastSync" class="sync-last-time">上次同步：{{ wecomLastSync }}</span>
          </div>
          <div class="sync-section">
            <p class="sync-section-label">同步范围</p>
            <el-radio-group v-model="wecomSyncRange">
              <el-radio value="full">全量同步（同步全部部门和成员）</el-radio>
              <el-radio value="department">按部门同步</el-radio>
            </el-radio-group>
            <div v-if="wecomSyncRange === 'department'" class="sync-dept-picker">
              <el-checkbox-group v-model="wecomSelectedDepts">
                <el-checkbox v-for="d in wecomDeptOptions" :key="d" :label="d" :value="d">{{ d }}</el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
          <div class="sync-section">
            <p class="sync-section-label">同步说明</p>
            <ul class="sync-notes">
              <li>同步后自动创建学员账号，初始密码为统一默认密码</li>
              <li>已存在的学员（按工号匹配）将更新部门信息，不会重复创建</li>
              <li>新同步的学员默认状态为"已开通"</li>
              <li>同步完成后可直接在学员列表中管理权限状态</li>
            </ul>
          </div>
        </div>
      </template>
    </div>
    <template v-if="wecomAuthorized" #footer>
      <el-button @click="syncPageVisible = false">关闭</el-button>
      <el-button type="primary" :loading="wecomSyncLoading" @click="syncWecom">
        {{ wecomSyncLoading ? '同步中...' : '开始同步' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  margin-bottom: 28px;
}
.eyebrow {
  color: var(--teal);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.6px;
  margin-bottom: 7px;
}
.page-heading h1 {
  font-family: Georgia, serif;
  font-size: 31px;
}
.page-heading p:not(.eyebrow) {
  color: var(--muted);
  font-size: 13px;
}
.stats {
  display: flex;
  gap: 1px;
  margin-bottom: 20px;
}
.stats div {
  min-width: 160px;
  padding: 16px 21px;
  background: var(--paper);
  border: 1px solid var(--line);
}
.stats small,
.stats strong {
  display: block;
}
.stats small {
  color: var(--muted);
  font-size: 11px;
}
.stats strong {
  font-size: 24px;
  margin-top: 4px;
}
.pending-stat strong { color: var(--orange); }
.table-wrap {
  overflow: auto;
  background: var(--paper);
  border: 1px solid var(--line);
}
.table-tools {
  display: flex;
  gap: 10px;
  padding: 17px 20px;
  border-bottom: 1px solid var(--line);
}
.table-tools .el-input {
  max-width: 260px;
}
table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 12px;
  white-space: nowrap;
}
th {
  color: var(--muted);
  font-size: 10px;
  font-weight: 500;
  background: #f7faf9;
}
th,
td {
  padding: 16px 20px;
  border-bottom: 1px solid #edf1f0;
}
.student {
  display: flex;
  align-items: center;
  gap: 9px;
}
.student span {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  background: #f5d1bd;
  color: #9b5635;
  border-radius: 50%;
  font-size: 11px;
}
.student strong {
  font-weight: 600;
}
.progress {
  display: inline-block;
  width: 90px;
  height: 4px;
  margin-right: 8px;
  background: #e8eeee;
}
.progress i {
  display: block;
  height: 100%;
  background: var(--teal);
}
td small {
  color: var(--muted);
  font-size: 10px;
}
.source-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 8px;
  background: var(--mint);
  color: var(--teal);
  font-size: 10px;
}
.source-tag.sync { background: #e1f5ee; color: #0f6e56; }
.source-tag.batch { background: #faeeda; color: #b45309; }
.permission-switch {
  position: relative;
  width: 45px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: 14px;
  background: #d1d7df;
  cursor: pointer;
}
.permission-switch i {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px #24364a33;
  transition: left 0.15s;
}
.permission-switch.on { background: #0f6e56; }
.permission-switch.on i { left: 22px; }
.actions {
  display: flex;
  gap: 6px;
}
.actions button {
  cursor: pointer;
  font-size: 12px;
  padding: 6px 15px;
  border-radius: 6px;
}
.action-primary {
  border: 1px solid #185fa5;
  background: #185fa5;
  color: #fff;
}
.action-remove {
  border: 1px solid #d4c0c0;
  background: #fff;
  color: #a32d2d;
}
.sync-locked {
  color: var(--muted);
  font-size: 11px;
  cursor: help;
}
.review-name {
  margin: 0 0 12px;
  color: #1f2937;
  font-size: 16px;
}
.save-review { min-width: 170px; }
.push-review { min-width: 128px; }
.review-tip {
  margin: 0 0 20px;
  padding: 14px 16px;
  border-radius: 9px;
  background: #e6f1fb;
  color: #185fa5;
  text-align: left;
  font-size: 13px;
  line-height: 1.7;
}
.review-actions {
  display: flex;
  gap: 15px;
}
.review-actions .save-review { flex: 1; height: 51px; }
.review-actions .push-review { width: 128px; height: 51px; }
.dialog-copy { color: var(--muted); font-size: 12px; margin-bottom: 15px }
.mode-options { display: flex; flex-direction: column; gap: 10px }
.mode-options button { display: grid; gap: 3px; padding: 14px; border: 1px solid var(--line); border-radius: 8px; background: #fff; text-align: left; cursor: pointer }
.mode-options button:hover { border-color: var(--teal); background: var(--mint) }
.mode-options b { font-size: 13px }
.mode-options span { color: var(--muted); font-size: 11px }
.form-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px }
.form-hint { color: var(--muted); font-size: 11px; margin: -8px 0 12px }
.password-config { width: 100% }
.excel-import { display: flex; flex-direction: column; gap: 20px }
.import-step { padding: 16px; border: 1px solid var(--line); border-radius: 8px; background: #fafbfc }
.step-label { margin-bottom: 4px }
.step-label b { font-size: 13px; color: var(--ink) }
.step-desc { color: var(--muted); font-size: 11px; margin-bottom: 12px }
.preview-table { margin-top: 8px; overflow: auto; max-height: 200px; border: 1px solid var(--line); border-radius: 6px }
.preview-table table { width: 100%; border-collapse: collapse }
.preview-table th,.preview-table td { padding: 8px 10px; border-bottom: 1px solid var(--line); font-size: 11px; text-align: left }
.preview-table th { background: #f7faf9; color: var(--muted); font-weight: 500 }
.preview-table td { color: #233e61 }
.more-tip { color: var(--muted); font-size: 11px; margin-top: 8px; text-align: center }
.sync-content { padding: 8px 0 }
.sync-authorize { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 30px 0; text-align: center }
.sync-icon { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 14px; background: #07c160; color: #fff; font-size: 22px; font-weight: 700 }
.sync-authorize h3 { font-size: 18px; margin: 4px 0 }
.sync-desc { color: var(--muted); font-size: 13px; line-height: 1.7; max-width: 400px }
.sync-hint { color: var(--muted); font-size: 11px; margin-top: 12px }
.sync-status { display: flex; flex-direction: column; gap: 20px }
.sync-status-head { display: flex; align-items: center; gap: 12px }
.sync-badge { display: inline-block; padding: 4px 12px; border-radius: 10px; font-size: 11px }
.sync-badge.authorized { background: #e1f5ee; color: #0f6e56 }
.sync-last-time { color: var(--muted); font-size: 12px }
.sync-section { padding: 16px; border: 1px solid var(--line); border-radius: 8px; background: #fafbfc }
.sync-section-label { font-size: 13px; font-weight: 600; margin-bottom: 10px }
.sync-dept-picker { margin-top: 12px }
.sync-dept-picker .el-checkbox-group { display: flex; flex-wrap: wrap; gap: 8px }
.sync-notes { margin: 0; padding-left: 18px; color: var(--muted); font-size: 12px; line-height: 2 }
@media (max-width: 600px) {
  .page-heading { display: block }
  .page-heading .el-button { margin-top: 18px }
  .stats div { min-width: 0; flex: 1 }
  .table-tools { flex-wrap: wrap }
  .table-tools .el-input { max-width: none; width: 100% }
  .form-row2 { grid-template-columns: 1fr }
}
</style>
