import { createPinia } from 'pinia'
import { createApp } from 'vue'

import { setUnauthorizedHandler } from '@/api/client'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import { useAuthStore } from '@/stores/auth'
import '@/style.css'
import 'vue-sonner/style.css'

async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK !== 'true') return
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledFrame: 'bypass' })
}

try {
  await enableMocking()
} catch (error) {
  // 서비스 워커는 localhost나 https에서만 동작한다. 다른 주소로 열면 빈 화면 대신 이유를 보여준다
  document.body.textContent =
    '가짜 서버(MSW)를 시작하지 못했습니다. http://localhost 주소로 열었는지 확인하세요.'
  throw error
}

const app = createApp(App).use(createPinia())
const router = createAppRouter()
app.use(router)

// 로그인이 풀리면(401) 로그인 화면으로 보내고, 다시 로그인하면 보던 화면으로 돌아온다
setUnauthorizedHandler(() => {
  const current = router.currentRoute.value
  if (current.name === 'login') return
  useAuthStore().logout()
  void router.push({ name: 'login', query: { redirect: current.fullPath } })
})

// 새로 배포했거나 개발 서버가 다시 묶으면 화면 파일을 못 불러올 수 있다. 한 번만 새로고침해서 복구한다
router.onError((error, to) => {
  const chunkFailed = /dynamically imported module|Importing a module script failed/.test(
    String(error),
  )
  if (!chunkFailed || sessionStorage.getItem('rr.reloadedFor') === to.fullPath) return
  sessionStorage.setItem('rr.reloadedFor', to.fullPath)
  window.location.assign(to.fullPath)
})
router.afterEach(() => sessionStorage.removeItem('rr.reloadedFor'))

app.mount('#app')
