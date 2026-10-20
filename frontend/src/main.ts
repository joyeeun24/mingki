import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from '@/App.vue'
import router from '@/router'
import '@/style.css'

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
createApp(App).use(createPinia()).use(router).mount('#app')
