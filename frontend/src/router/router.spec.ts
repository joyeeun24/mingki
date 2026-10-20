import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'

import { OFFICER } from '@/test/mountPage'

import { createAppRouter, safeRedirect } from '.'

function login() {
  sessionStorage.setItem('rr.auth', JSON.stringify({ token: 'mock-officer1', user: OFFICER }))
}

beforeEach(() => {
  sessionStorage.clear()
  setActivePinia(createPinia())
})

describe('로그인 가드', () => {
  it('로그인 안 했으면 로그인 화면으로 보내고 원래 주소를 기억한다', async () => {
    const router = createAppRouter(createMemoryHistory())
    await router.push('/tasks/t-1/review')
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/tasks/t-1/review')
  })

  it('로그인한 채로 로그인 화면에 오면 기억한 주소로 보낸다', async () => {
    login()
    const router = createAppRouter(createMemoryHistory())
    await router.push('/login?redirect=/tasks/t-1/review')
    expect(router.currentRoute.value.fullPath).toBe('/tasks/t-1/review')
  })

  it('다른 사이트로 가는 주소는 따르지 않는다', async () => {
    login()
    const router = createAppRouter(createMemoryHistory())
    await router.push('/login?redirect=//evil.example.com')
    expect(router.currentRoute.value.name).toBe('upload')
    expect(safeRedirect('https://evil.example.com')).toBeNull()
    expect(safeRedirect('/tasks/t-1')).toBe('/tasks/t-1')
  })
})
