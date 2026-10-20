import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { login } from '@/api/auth'
import { setToken } from '@/api/client'
import type { User } from '@/domain'

import { useAuthStore } from './auth'

vi.mock('@/api/auth', () => ({ login: vi.fn() }))
vi.mock('@/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/client')>()),
  setToken: vi.fn(),
}))

const officer: User = { userId: 1, username: 'officer1', displayName: '김준법', role: 'OFFICER' }

beforeEach(() => {
  sessionStorage.clear()
  setActivePinia(createPinia())
  vi.mocked(setToken).mockClear()
})

describe('auth store: 탭마다 로그인 상태를 sessionStorage에 둔다', () => {
  it('저장된 로그인 정보를 복원하고 토큰을 설정한다', () => {
    sessionStorage.setItem('rr.auth', JSON.stringify({ token: 'mock-officer1', user: officer }))
    const auth = useAuthStore()
    expect(auth.isLoggedIn).toBe(true)
    expect(auth.user).toEqual(officer)
    expect(setToken).toHaveBeenLastCalledWith('mock-officer1')
  })

  it('깨진 값은 지우고 로그아웃 상태로 시작한다', () => {
    sessionStorage.setItem('rr.auth', '{깨진 값')
    const auth = useAuthStore()
    expect(auth.isLoggedIn).toBe(false)
    expect(sessionStorage.getItem('rr.auth')).toBeNull()
    expect(setToken).toHaveBeenLastCalledWith(null)
  })

  it('로그인하면 저장하고, 로그아웃하면 지운다', async () => {
    vi.mocked(login).mockResolvedValue({ token: 'mock-officer1', ...officer })
    const auth = useAuthStore()

    await auth.login('officer1', 'password')
    expect(auth.user).toEqual(officer)
    expect(JSON.parse(sessionStorage.getItem('rr.auth')!)).toEqual({
      token: 'mock-officer1',
      user: officer,
    })
    expect(setToken).toHaveBeenLastCalledWith('mock-officer1')

    auth.logout()
    expect(auth.isLoggedIn).toBe(false)
    expect(sessionStorage.getItem('rr.auth')).toBeNull()
    expect(setToken).toHaveBeenLastCalledWith(null)
  })
})
