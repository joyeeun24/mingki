import {
  createRouter,
  createWebHistory,
  type NavigationGuard,
  type RouteRecordRaw,
  type RouterHistory,
} from 'vue-router'

import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean // 로그인 없이 볼 수 있는 화면
  }
}

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: { name: 'upload' } },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { public: true },
  },
  { path: '/tasks/new', name: 'upload', component: () => import('@/pages/UploadPage.vue') },
  {
    path: '/tasks/:id',
    component: () => import('@/pages/TaskLayout.vue'),
    children: [
      {
        path: '',
        name: 'task-progress',
        component: () => import('@/pages/TaskProgressPage.vue'),
      },
      {
        path: 'requirements',
        name: 'task-requirements',
        component: () => import('@/pages/RequirementsPage.vue'),
      },
      {
        path: 'locations',
        name: 'task-locations',
        component: () => import('@/pages/LocationsPage.vue'),
      },
      { path: 'review', name: 'task-review', component: () => import('@/pages/ReviewPage.vue') },
      { path: 'report', name: 'task-report', component: () => import('@/pages/ReportPage.vue') },
      {
        path: 'evaluation',
        name: 'task-evaluation',
        component: () => import('@/pages/EvaluationPage.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { public: true },
  },
]

/** 같은 사이트 안의 경로만 따른다 (//evil.com 같은 값 무시) */
export function safeRedirect(value: unknown): string | null {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : null
}

export const authGuard: NavigationGuard = (to) => {
  const auth = useAuthStore()
  if (to.name === 'login') {
    return auth.isLoggedIn ? (safeRedirect(to.query.redirect) ?? { name: 'upload' }) : true
  }
  if (!to.meta.public && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
}

export function createAppRouter(
  history: RouterHistory = createWebHistory(import.meta.env.BASE_URL),
) {
  const router = createRouter({ history, routes })
  router.beforeEach(authGuard)
  return router
}
