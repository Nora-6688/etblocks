<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const items = [
  { name: '管理看板', path: '/admin/overview', icon: '▥' },
  { name: '课程管理', path: '/admin/courses', icon: '□' },
  { name: 'Blocks 创建', path: '/admin/blocks', icon: '⊞' },
  { name: '考试管理', path: '/admin/exams', icon: '✓' },
  { name: '学员管理', path: '/admin/students', icon: '♙' },
]
const title = computed(() => items.find((item) => item.path === route.path)?.name ?? '管理看板')
function logout() {
  sessionStorage.removeItem('etblocks-user')
  router.push('/login')
}
</script>
<template>
  <div class="admin-shell">
    <aside class="admin-side">
      <div class="brand"><span>ET</span><strong>blocks</strong><small>ADMIN CONSOLE</small></div>
      <div class="side-title">管理端</div>
      <nav>
        <RouterLink v-for="item in items" :key="item.path" :to="item.path" class="item"
          ><b>{{ item.icon }}</b
          >{{ item.name }}</RouterLink
        >
      </nav>
      <RouterLink class="back" to="/blocks">← 返回学员端</RouterLink>
    </aside>
    <main>
      <header>
        <span>管理端 / {{ title }}</span>
        <div class="user">
          <span>Nora · 管理员</span><a class="logout" href="/login" @click.prevent="logout">退出</a
          ><i>N</i>
        </div>
      </header>
      <div class="content"><RouterView /></div>
    </main>
  </div>
</template>
<style scoped>
.admin-shell {
  min-height: 100vh;
  display: flex;
  background: var(--canvas);
}
.admin-side {
  width: 226px;
  flex: none;
  background: #123354;
  color: #dbe9f7;
  padding: 29px 15px;
  display: flex;
  flex-direction: column;
}
.brand {
  padding: 0 13px 25px;
  color: #fff;
}
.brand span {
  display: inline-grid;
  place-items: center;
  width: 33px;
  height: 33px;
  border: 2px solid #82b8e4;
  color: #82b8e4;
  font-weight: 800;
  font-size: 11px;
}
.brand strong {
  font-size: 18px;
  margin-left: 9px;
}
.brand small {
  display: block;
  color: #85a5c4;
  font-size: 8px;
  letter-spacing: 1.7px;
  margin: 4px 0 0 43px;
}
.side-title {
  padding: 13px;
  border-top: 1px solid #315a7c;
  border-bottom: 1px solid #315a7c;
  color: #90afd0;
  font-size: 12px;
  font-weight: 700;
}
nav {
  margin-top: 18px;
}
.item {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 45px;
  padding: 0 13px;
  color: #abc1d8;
  font-size: 13px;
}
.item b {
  width: 17px;
  color: #8bb3d4;
  text-align: center;
  font-size: 17px;
}
.item.router-link-active {
  color: #fff;
  background: #245783;
  box-shadow: inset 3px 0 #83bce8;
}
.back {
  margin-top: auto;
  padding: 13px;
  color: #9db7d1;
  font-size: 12px;
  border-top: 1px solid #315a7c;
}
main {
  min-width: 0;
  flex: 1;
}
header {
  height: 77px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 42px;
  background: #fff;
  border-bottom: 1px solid var(--line);
  color: #75858a;
  font-size: 12px;
}
.user {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
}
.user i {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #534ab7;
  color: #fff;
  font-style: normal;
  font-weight: 700;
}
.logout {
  color: #7d8794;
  font-size: 12px;
  text-decoration: none;
}
.content {
  max-width: 1440px;
  margin: auto;
  padding: 38px 42px 60px;
}
@media (max-width: 600px) {
  .admin-side {
    width: 68px;
    padding: 20px 8px;
  }
  .brand strong,
  .brand small,
  .side-title,
  .item:not(.router-link-active)::first-letter {
    display: none;
  }
  .brand {
    padding: 0 8px 25px;
  }
  .item {
    justify-content: center;
    font-size: 0;
    padding: 0;
  }
  .item b {
    font-size: 17px;
  }
  .back {
    font-size: 0;
    text-align: center;
  }
  .back:first-letter {
    font-size: 16px;
  }
  header {
    height: 64px;
    padding: 0 18px;
  }
  .user {
    font-size: 0;
  }
  .content {
    padding: 24px 18px;
  }
}
</style>
