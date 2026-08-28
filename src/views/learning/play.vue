<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCourseStore, type CourseCategory } from '@/stores/course'

const route = useRoute()
const router = useRouter()
const store = useCourseStore()
const course = computed(() => store.getCourseById(String(route.params.id)))

const videoRef = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const playbackRate = ref(1)
const showRateMenu = ref(false)
const isFullscreen = ref(false)

const rates = [0.5, 1, 1.25, 1.5, 2]

const categoryColors: Record<CourseCategory, string> = {
  企业文化: '#185fa5',
  工作流程: '#0f6e56',
  岗位知识: '#534ab7',
  行业知识: '#b45309',
  规章制度: '#6b7280',
}

function formatTime(sec: number) {
  if (!sec || isNaN(sec)) return '00:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function togglePlay() {
  const v = videoRef.value
  if (!v) return
  if (v.paused) { v.play(); isPlaying.value = true }
  else { v.pause(); isPlaying.value = false }
}

function seek(offset: number) {
  const v = videoRef.value
  if (!v) return
  v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + offset))
}

function onTimeUpdate() {
  const v = videoRef.value
  if (!v) return
  currentTime.value = v.currentTime
}

function onLoaded() {
  const v = videoRef.value
  if (!v) return
  duration.value = v.duration
}

function onSeek(e: Event) {
  const target = e.target as HTMLInputElement
  const v = videoRef.value
  if (!v) return
  v.currentTime = Number(target.value)
}

function onVolume(e: Event) {
  const target = e.target as HTMLInputElement
  const v = videoRef.value
  if (!v) return
  v.volume = Number(target.value)
  volume.value = Number(target.value)
}

function setRate(rate: number) {
  const v = videoRef.value
  if (!v) return
  v.playbackRate = rate
  playbackRate.value = rate
  showRateMenu.value = false
}

function toggleFullscreen() {
  const container = document.querySelector('.player-container') as HTMLElement
  if (!container) return
  if (!document.fullscreenElement) {
    container.requestFullscreen().then(() => { isFullscreen.value = true }).catch(() => {})
  } else {
    document.exitFullscreen().then(() => { isFullscreen.value = false }).catch(() => {})
  }
}

function onKey(e: KeyboardEvent) {
  if (!course.value) return
  switch (e.key) {
    case ' ':
    case 'Spacebar':
      e.preventDefault(); togglePlay(); break
    case 'ArrowRight':
      seek(10); break
    case 'ArrowLeft':
      seek(-10); break
    case 'f':
    case 'F':
      toggleFullscreen(); break
  }
}

onMounted(() => { window.addEventListener('keydown', onKey) })
onUnmounted(() => { window.removeEventListener('keydown', onKey) })

function goBack() { router.push(`/course/${route.params.id}`) }
function goLearning() { router.push('/learning') }
</script>

<template>
  <div v-if="course" class="play-page">
    <div class="play-header">
      <button @click="goBack">← 返回课程详情</button>
      <div class="header-info">
        <b>{{ course.name }}</b>
        <span>{{ course.category }} · {{ course.difficulty }} · {{ course.duration }}</span>
      </div>
      <button @click="goLearning">学习列表</button>
    </div>
    <div class="player-container" :style="{ background: categoryColors[course.category] }">
      <video
        v-if="course.contentUrl"
        ref="videoRef"
        class="video-el"
        :src="course.contentUrl"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoaded"
        @click="togglePlay"
        @play="isPlaying = true"
        @pause="isPlaying = false"
        controlsList="nodownload noplaybackrate"
        playsinline
      />
      <div v-else class="no-content">
        <div class="no-content-icon">📺</div>
        <p>该课程暂未上传视频文件</p>
        <p class="no-content-sub">请在管理端上传课程视频后查看</p>
      </div>
      <div v-if="course.contentUrl" class="custom-controls" @click.stop>
        <div class="progress-row">
          <span class="time">{{ formatTime(currentTime) }}</span>
          <input
            type="range"
            class="seek-bar"
            min="0"
            :max="duration || 0"
            step="0.1"
            :value="currentTime"
            @input="onSeek"
          />
          <span class="time">{{ formatTime(duration) }}</span>
        </div>
        <div class="btn-row">
          <button class="ctrl-btn" @click="seek(-10)" title="后退10秒">⏪</button>
          <button class="ctrl-btn play-btn" @click="togglePlay" :title="isPlaying ? '暂停' : '播放'">
            {{ isPlaying ? '⏸' : '▶' }}
          </button>
          <button class="ctrl-btn" @click="seek(10)" title="前进10秒">⏩</button>
          <div class="rate-wrap">
            <button class="ctrl-btn" @click="showRateMenu = !showRateMenu" title="倍速">
              {{ playbackRate }}×
            </button>
            <div v-if="showRateMenu" class="rate-menu">
              <button
                v-for="r in rates"
                :key="r"
                :class="{ active: playbackRate === r }"
                @click="setRate(r)"
              >{{ r }}×</button>
            </div>
          </div>
          <input
            type="range"
            class="volume-bar"
            min="0"
            max="1"
            step="0.05"
            :value="volume"
            @input="onVolume"
            title="音量"
          />
          <button class="ctrl-btn" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏'">
            {{ isFullscreen ? '🗗' : '⛶' }}
          </button>
        </div>
      </div>
    </div>
    <div class="play-sidebar">
      <div class="sidebar-section">
        <h3>课程信息</h3>
        <div class="info-grid">
          <div><small>讲师</small><span>{{ course.creator }}</span></div>
          <div><small>时长</small><span>{{ course.duration }}</span></div>
          <div><small>难度</small><span>{{ course.difficulty }}</span></div>
          <div><small>类型</small><span>{{ course.type }}</span></div>
        </div>
      </div>
      <div class="sidebar-section">
        <h3>课程简介</h3>
        <p>{{ course.description }}</p>
      </div>
      <div class="sidebar-section">
        <h3>键盘快捷键</h3>
        <div class="shortcut"><kbd>空格</kbd><span>播放/暂停</span></div>
        <div class="shortcut"><kbd>←</kbd><span>后退10秒</span></div>
        <div class="shortcut"><kbd>→</kbd><span>前进10秒</span></div>
        <div class="shortcut"><kbd>F</kbd><span>全屏切换</span></div>
      </div>
    </div>
  </div>
  <div v-else class="not-found">
    <p>课程不存在或已下架</p>
    <el-button type="primary" @click="goLearning">返回学习列表</el-button>
  </div>
</template>

<style scoped>
.play-page { max-width: 1200px; margin: 0 auto; }
.play-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.play-header button { border: 0; background: transparent; color: var(--teal); cursor: pointer; font-size: 13px; white-space: nowrap; }
.header-info { text-align: center; }
.header-info b { display: block; font-size: 17px; }
.header-info span { color: var(--muted); font-size: 12px; }
.player-container { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; }
.video-el { width: 100%; height: 100%; object-fit: contain; }
.no-content { text-align: center; color: #fff; }
.no-content-icon { font-size: 48px; }
.no-content p { margin: 10px 0 0; font-size: 14px; }
.no-content-sub { color: #ffffff99 !important; font-size: 12px !important; }
.custom-controls { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 12px 16px 8px; }
.progress-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.time { color: #fff; font-size: 11px; min-width: 40px; text-align: center; }
.seek-bar { flex: 1; -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: #ffffff44; cursor: pointer; }
.seek-bar::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: var(--teal); cursor: pointer; }
.seek-bar::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: var(--teal); cursor: pointer; border: 0; }
.btn-row { display: flex; align-items: center; gap: 8px; justify-content: center; }
.ctrl-btn { border: 0; border-radius: 4px; background: #ffffff22; color: #fff; cursor: pointer; font-size: 14px; padding: 6px 10px; transition: background 0.2s; }
.ctrl-btn:hover { background: #ffffff44; }
.play-btn { font-size: 18px; padding: 6px 14px; }
.rate-wrap { position: relative; }
.rate-menu { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); display: grid; gap: 2px; background: rgba(0,0,0,0.85); border-radius: 6px; padding: 4px; }
.rate-menu button { border: 0; background: transparent; color: #fff; cursor: pointer; font-size: 12px; padding: 6px 16px; border-radius: 3px; }
.rate-menu button.active { background: var(--teal); }
.rate-menu button:hover { background: #ffffff22; }
.volume-bar { width: 80px; -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: #ffffff44; cursor: pointer; }
.volume-bar::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #fff; cursor: pointer; }
.volume-bar::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: #fff; cursor: pointer; border: 0; }
.play-sidebar { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 20px; }
.sidebar-section { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 18px; }
.sidebar-section h3 { font-size: 13px; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid var(--line); }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.info-grid small { display: block; color: var(--muted); font-size: 11px; margin-bottom: 3px; }
.info-grid span { font-size: 13px; }
.sidebar-section p { color: #52677e; font-size: 12px; line-height: 1.7; }
.shortcut { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.shortcut kbd { display: inline-grid; place-items: center; min-width: 28px; height: 24px; border-radius: 4px; border: 1px solid var(--line); background: #f5f7fa; color: #52677e; font-size: 11px; }
.shortcut span { color: var(--muted); font-size: 12px; }
.not-found { display: grid; place-items: center; gap: 16px; min-height: 300px; }
.not-found p { color: var(--muted); font-size: 14px; }
@media (max-width: 800px) {
  .play-header { flex-wrap: wrap; }
  .play-sidebar { grid-template-columns: 1fr; }
}
</style>
