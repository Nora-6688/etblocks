<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useTodoStore } from '@/stores/todo'
import { useNotificationStore } from '@/stores/notification'

const route = useRoute()
const router = useRouter()
const todoStore = useTodoStore()
const notificationStore = useNotificationStore()
const user = ref(
  JSON.parse(sessionStorage.getItem('etblocks-user') ?? '{"name":"Nora","role":"学员"}'),
)
const navGroups = [
  {
    label: '学习中心',
    items: [
      { name: '学习看板', path: '/dashboard', icon: '⌂' },
      { name: '学习列表', path: '/learning', icon: '▦' },
      { name: '待学内容', path: '/todo', icon: '◷', badge: true },
      { name: '课后训练', path: '/training', icon: '✓' },
      { name: '个人中心', path: '/profile', icon: '♙' },
    ],
  },
]
const pageTitle = computed(() => {
  // 试卷说明/答题页归到"课后训练"域下
  if (route.path.startsWith('/paper')) return '课后训练'
  return (
    navGroups.flatMap((group) => group.items).find((item) => route.path === item.path)?.name ??
    '学习看板'
  )
})
function logout() {
  sessionStorage.removeItem('etblocks-user')
  router.push('/login')
}
function openNotifications() {
  // 消息通知主入口在学习看板右下方的消息面板
  router.push('/dashboard')
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">ET</span
        ><span class="brand-copy">ET Blocks<small>LEARNING PLATFORM</small></span>
      </div>
      <nav class="nav">
        <div v-for="group in navGroups" :key="group.label" class="nav-group">
          <p class="nav-label">{{ group.label }}</p>
          <RouterLink v-for="item in group.items" :key="item.path" :to="item.path" class="nav-item"
            ><span class="nav-icon">{{ item.icon }}</span
            ><span class="nav-text">{{ item.name }}</span
            ><b v-if="item.badge && todoStore.unfinishedCount" class="nav-badge">{{
              todoStore.unfinishedCount
            }}</b></RouterLink
          >
        </div>
      </nav>
      <div class="sidebar-foot">
        <div class="help-icon">?</div>
        <span class="nav-text">帮助与反馈</span>
      </div>
    </aside>
    <main class="main-panel">
      <header class="topbar">
        <div class="breadcrumb">ET Blocks <span>/</span> {{ pageTitle }}</div>
        <div class="top-actions">
          <button class="icon-button" title="通知" @click="openNotifications">
            ♧<i v-if="notificationStore.unreadCount"></i>
            <b v-if="notificationStore.unreadCount" class="bell-count">{{ notificationStore.unreadCount }}</b>
          </button>
          <div class="profile">
            <div>
              <strong>{{ user.name }}</strong
              ><small>业务部 · {{ user.role }}</small>
            </div>
            <RouterLink v-if="user.role === '管理员'" class="switch-admin" to="/admin/overview"
              >管理端</RouterLink
            >
            <a class="logout" href="/login" @click.prevent="logout">退出</a>
            <div class="avatar">N</div>
            <span>⌄</span>
          </div>
        </div>
      </header>
      <div class="page-content"><RouterView /></div>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  background: var(--canvas);
}
.sidebar {
  width: 244px;
  flex: 0 0 244px;
  min-height: 100vh;
  padding: 28px 16px 20px;
  background: #123354;
  color: #dbe9f7;
  display: flex;
  flex-direction: column;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px 30px;
  color: #fff;
}
.brand-mark {
  display: grid;
  place-items: center;
  width: 37px;
  height: 37px;
  border: 2px solid #82b8e4;
  color: #82b8e4;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
}
.brand-copy {
  font-size: 17px;
  font-weight: 700;
}
.brand-copy small {
  display: block;
  color: #85a5c4;
  font-size: 8px;
  letter-spacing: 2px;
  font-weight: 500;
}
.nav {
  margin-top: 18px;
}
.nav-group + .nav-group {
  margin-top: 27px;
}
.nav-label {
  margin: 0 12px 8px;
  color: #7898b8;
  font-size: 10px;
  letter-spacing: 1.2px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 13px;
  height: 43px;
  padding: 0 12px;
  color: #abc1d8;
  font-size: 13px;
}
.nav-item.router-link-active {
  color: #fff;
  background: #245783;
  box-shadow: inset 3px 0 #83bce8;
}
.nav-icon {
  width: 17px;
  text-align: center;
  color: #8bb3d4;
  font-size: 17px;
}
.nav-badge {
  margin-left: auto;
  min-width: 19px;
  padding: 1px 5px;
  border-radius: 10px;
  background: var(--orange);
  color: #fff;
  text-align: center;
  font-size: 10px;
}
.sidebar-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding: 14px 12px;
  border-top: 1px solid #315a7c;
  color: #9db7d1;
  font-size: 12px;
}
.help-icon {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border: 1px solid #83a5c5;
  border-radius: 50%;
  font-size: 11px;
}
.main-panel {
  min-width: 0;
  flex: 1;
}
.topbar {
  height: 77px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 42px;
  background: var(--paper);
  border-bottom: 1px solid var(--line);
}
.breadcrumb {
  color: #75858a;
  font-size: 12px;
}
.breadcrumb span {
  margin: 0 10px;
  color: #bac6c5;
}
.top-actions,
.profile {
  display: flex;
  align-items: center;
}
.top-actions {
  gap: 24px;
}
.icon-button {
  position: relative;
  border: 0;
  background: transparent;
  color: #788b8d;
  font-size: 20px;
  cursor: pointer;
}
.icon-button i {
  position: absolute;
  top: 1px;
  right: 0;
  width: 5px;
  height: 5px;
  background: var(--orange);
  border-radius: 50%;
}
.bell-count {
  position: absolute;
  top: -4px;
  right: -8px;
  min-width: 16px;
  padding: 1px 4px;
  border-radius: 8px;
  background: var(--orange);
  color: #fff;
  font-size: 9px;
  line-height: 1.2;
  text-align: center;
  font-weight: 700;
}
.profile {
  gap: 10px;
  font-size: 12px;
}
.profile strong,
.profile small {
  display: block;
}
.profile small {
  color: #839295;
  font-size: 10px;
}
.profile > span {
  margin-left: 5px;
  color: #849295;
}
.switch-admin,
.logout {
  border: 0;
  background: transparent;
  color: var(--teal);
  cursor: pointer;
  font-size: 11px;
}
.logout {
  color: var(--muted);
  padding: 0;
  text-decoration: none;
}
.avatar {
  display: grid;
  place-items: center;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: #534ab7;
  color: #fff;
  font-weight: 700;
}
.page-content {
  max-width: 1440px;
  margin: 0 auto;
  padding: 38px 42px 60px;
}
@media (max-width: 760px) {
  .sidebar {
    width: 70px;
    flex-basis: 70px;
    padding: 22px 9px;
  }
  .brand {
    padding: 0 7px 30px;
  }
  .brand-copy,
  .nav-text,
  .nav-label,
  .sidebar-foot .nav-text {
    display: none;
  }
  .nav-item {
    justify-content: center;
    padding: 0;
  }
  .nav-badge {
    position: absolute;
    margin: -25px 0 0 25px;
  }
  .sidebar-foot {
    justify-content: center;
    padding: 14px 0;
  }
  .topbar {
    height: 64px;
    padding: 0 18px;
  }
  .profile > div:not(.avatar),
  .profile > span,
  .switch-admin,
  .logout {
    display: none;
  }
  .page-content {
    padding: 24px 18px 40px;
  }
}
</style>
