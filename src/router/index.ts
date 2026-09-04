import { createRouter, createWebHistory } from 'vue-router'

// 路由实例--管理路径与组件的关系
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // 登录页面
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/index.vue'),
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/layout/index.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/blocks/index.vue'),
        },
        {
          path: 'learning',
          name: 'learning',
          component: () => import('@/views/learning/index.vue'),
        },
        {
          path: 'course/:id',
          name: 'course-detail',
          component: () => import('@/views/learning/detail.vue'),
        },
        {
          path: 'course/play/:id',
          name: 'course-play',
          component: () => import('@/views/learning/play.vue'),
        },
        {
          path: 'block/:id',
          name: 'block-detail',
          component: () => import('@/views/learning/block-detail.vue'),
        },
        { path: 'todo', name: 'todo', component: () => import('@/views/todo/index.vue') },
        {
          path: 'training',
          name: 'training',
          component: () => import('@/views/training/index.vue'),
        },
        {
          // 试卷 / 练习卷说明页：从待学内容点进来先看到它
          path: 'paper/:id',
          name: 'paper-intro',
          component: () => import('@/views/training/paper-intro.vue'),
        },
        {
          // 整页答题页：说明页点「开始考试」进入
          path: 'paper/:id/answer',
          name: 'paper-answer',
          component: () => import('@/views/training/paper-answer.vue'),
        },
        {
          // 练习页：未完成时显示做题页，已完成时显示回顾页；按 from=history 或检测完成记录切换
          path: 'practice/:id',
          name: 'practice-page',
          component: () => import('@/views/training/practice-page.vue'),
        },
        { path: 'profile', name: 'profile', component: () => import('@/views/profile/index.vue') },
      ],
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/admin/layout.vue'),
      redirect: '/admin/overview',
      children: [
        {
          path: 'overview',
          name: 'admin-overview',
          component: () => import('@/views/admin/overview.vue'),
        },
        {
          path: 'blocks',
          name: 'admin-blocks',
          component: () => import('@/views/admin/blocks.vue'),
        },
        { path: 'exams', name: 'admin-exams', component: () => import('@/views/admin/exams.vue') },
        {
          path: 'courses',
          name: 'admin-courses',
          component: () => import('@/views/admin/courses.vue'),
        },
        {
          path: 'students',
          name: 'admin-students',
          component: () => import('@/views/admin/students.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const rawUser = sessionStorage.getItem('etblocks-user')
  const user = rawUser ? (JSON.parse(rawUser) as { role?: string }) : null
  if (to.path === '/login') return true
  if (!user) return '/login'
  if (to.path.startsWith('/admin') && user.role !== '管理员') return '/dashboard'
  return true
})

export default router
