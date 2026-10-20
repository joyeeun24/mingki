import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { login as requestLogin } from '@/api/auth'
import { setToken } from '@/api/client'
import type { User } from '@/domain'

// 탭마다 따로 둔다. 담당자 창과 개발자 창을 동시에 띄우는 데모를 위해 sessionStorage를 쓴다
const KEY = 'rr.auth'

interface Session {
  token: string
  user: User
}

function restore(): Session | null {
  const raw = sessionStorage.getItem(KEY)
  if (raw === null) return null
  try {
    const session = JSON.parse(raw) as Partial<Session>
    if (typeof session.token === 'string' && typeof session.user?.role === 'string') {
      return session as Session
    }
  } catch {
    // 아래에서 지운다
  }
  sessionStorage.removeItem(KEY)
  return null
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(restore())
  setToken(session.value?.token ?? null)

  const user = computed(() => session.value?.user ?? null)
  const isLoggedIn = computed(() => session.value !== null)

  async function login(username: string, password: string) {
    const { token, ...user } = await requestLogin({ username, password })
    session.value = { token, user }
    sessionStorage.setItem(KEY, JSON.stringify(session.value))
    setToken(token)
  }

  function logout() {
    session.value = null
    sessionStorage.removeItem(KEY)
    setToken(null)
  }

  return { user, isLoggedIn, login, logout }
})
