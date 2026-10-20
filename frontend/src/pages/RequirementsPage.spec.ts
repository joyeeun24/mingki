import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { approveRequirements, getRequirements } from '@/api/tasks'
import { requirementsResponse, taskDetail } from '@/mocks/responses'
import { buttonByText, demoSnapshot, DEVELOPER, mountPage, OFFICER } from '@/test/mountPage'

import RequirementsPage from './RequirementsPage.vue'

vi.mock('@/api/tasks', () => ({ getRequirements: vi.fn(), approveRequirements: vi.fn() }))
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const waiting = demoSnapshot('requirements')
const path = `/tasks/${waiting.task.id}/requirements`

beforeEach(() => {
  vi.mocked(getRequirements).mockResolvedValue(requirementsResponse(waiting))
  vi.mocked(approveRequirements).mockReset()
})

describe('요건 확정 화면', () => {
  it('모든 요건을 고르기 전엔 제출할 수 없고, 고른 결정을 그대로 보낸 뒤 진행 상황으로 간다', async () => {
    const { wrapper, router, context } = await mountPage(RequirementsPage, {
      user: OFFICER,
      detail: taskDetail(waiting),
      path,
    })
    const submit = buttonByText(wrapper, '결정 제출')
    expect(submit.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('요건 3건 중 0건 결정')

    await buttonByText(wrapper, '모두 확정').trigger('click')
    await wrapper.find('#req-2-held').trigger('click')
    expect(wrapper.text()).toContain('요건 3건 중 3건 결정')
    expect(submit.attributes('disabled')).toBeUndefined()

    await submit.trigger('click')
    await flushPromises()
    expect(approveRequirements).toHaveBeenCalledWith(waiting.task.id, {
      decisions: [
        { requirementId: 1, decision: 'CONFIRMED' },
        { requirementId: 2, decision: 'HELD' },
        { requirementId: 3, decision: 'CONFIRMED' },
      ],
      comment: undefined,
    })
    expect(context.refresh).toHaveBeenCalled()
    // 이동할 화면은 지연 로딩이라 불러올 때까지 기다린다
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('task-progress'))
  })

  it('개발자는 확정할 수 없고 이유를 보여준다', async () => {
    const { wrapper } = await mountPage(RequirementsPage, {
      user: DEVELOPER,
      detail: taskDetail(waiting),
      path,
    })
    expect(wrapper.text()).toContain('담당자 계정으로 전환하세요')
    expect(buttonByText(wrapper, '모두 확정').attributes('disabled')).toBeDefined()
    expect(buttonByText(wrapper, '결정 제출').attributes('disabled')).toBeDefined()
  })
})
