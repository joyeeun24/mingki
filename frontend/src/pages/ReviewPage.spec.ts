import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getPatches } from '@/api/tasks'
import { patchesResponse, taskDetail } from '@/mocks/responses'
import { buttonByText, demoSnapshot, DEVELOPER, mountPage, OFFICER } from '@/test/mountPage'
import type { Snapshot } from '@/mocks/scenario'
import type { User } from '@/domain'

import ReviewPage from './ReviewPage.vue'

vi.mock('@/api/tasks', () => ({ getPatches: vi.fn(), reviewPatches: vi.fn() }))
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

async function open(snapshot: Snapshot, user: User) {
  vi.mocked(getPatches).mockResolvedValue(patchesResponse(snapshot))
  return mountPage(ReviewPage, {
    user,
    detail: taskDetail(snapshot),
    path: `/tasks/${snapshot.task.id}/review`,
  })
}

beforeEach(() => vi.mocked(getPatches).mockReset())

describe('검토 · 승인 화면', () => {
  it('개발자 · 검토 대기 · 모두 통과면 승인할 수 있다', async () => {
    const { wrapper } = await open(demoSnapshot('review'), DEVELOPER)
    expect(buttonByText(wrapper, '승인').attributes('disabled')).toBeUndefined()
    expect(wrapper.text()).toContain('검증 2/2회차 결과')
  })

  it('1회차에 실패한 파일은 회차별로 나눠 보여준다', async () => {
    const { wrapper } = await open(demoSnapshot('review'), DEVELOPER)
    expect(wrapper.text()).toContain('1회차 · 실패')
    expect(wrapper.text()).toContain('2회차 · 통과')
  })

  it('담당자는 승인할 수 없고 이유를 보여준다', async () => {
    const { wrapper } = await open(demoSnapshot('review'), OFFICER)
    expect(buttonByText(wrapper, '승인').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('개발자 계정으로 전환하세요')
  })

  it('검증 중에는 승인할 수 없다', async () => {
    const { wrapper } = await open(demoSnapshot('verifying'), DEVELOPER)
    expect(buttonByText(wrapper, '승인').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('검증이 끝나면 승인할 수 있습니다')
  })
})
