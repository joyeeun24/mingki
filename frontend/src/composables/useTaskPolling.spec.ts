import { effectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/api/client'
import { getTask } from '@/api/tasks'
import type { TaskDetail } from '@/api/types'
import { taskDetail } from '@/mocks/responses'
import { SCHEDULE, scenario } from '@/mocks/scenario'

import { useTaskPolling } from './useTaskPolling'

vi.mock('@/api/tasks', () => ({ getTask: vi.fn() }))

const T0 = 1_000_000
const waiting = taskDetail(
  scenario(
    't-1',
    {
      uploadedAt: T0,
      requesterId: 1,
      title: '개인신용대출 운영기준 v3 → v4',
      filenames: { old: 'v3.md', new: 'v4.md' },
      requirements: null,
      review: null,
    },
    T0 + SCHEDULE.extracting,
  ),
)
const done: TaskDetail = { ...waiting, task: { ...waiting.task, status: 'DONE' } }

function start() {
  const scope = effectScope()
  const context = scope.run(() => useTaskPolling('t-1', 1000))!
  return { context, scope }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(getTask).mockReset()
})
afterEach(() => vi.useRealTimers())

describe('useTaskPolling', () => {
  it('1초마다 다시 받고, 끝난 상태가 되면 멈춘다', async () => {
    vi.mocked(getTask)
      .mockResolvedValueOnce(waiting)
      .mockResolvedValueOnce(waiting)
      .mockResolvedValue(done)
    const { context, scope } = start()

    await vi.advanceTimersByTimeAsync(0)
    expect(getTask).toHaveBeenCalledTimes(1)
    expect(context.detail.value?.task.status).toBe('WAITING_REQUIREMENT_APPROVAL')

    await vi.advanceTimersByTimeAsync(2000)
    expect(getTask).toHaveBeenCalledTimes(3)
    expect(context.detail.value?.task.status).toBe('DONE')

    await vi.advanceTimersByTimeAsync(5000)
    expect(getTask).toHaveBeenCalledTimes(3)
    scope.stop()
  })

  it('작업이 없으면(404) 표시하고 멈춘다', async () => {
    vi.mocked(getTask).mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'task not found'))
    const { context, scope } = start()

    await vi.advanceTimersByTimeAsync(3000)
    expect(context.notFound.value).toBe(true)
    expect(getTask).toHaveBeenCalledTimes(1)
    scope.stop()
  })

  it('다른 오류는 이전 데이터를 그대로 두고 계속 받는다', async () => {
    vi.mocked(getTask)
      .mockResolvedValueOnce(waiting)
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValue(waiting)
    const { context, scope } = start()

    await vi.advanceTimersByTimeAsync(1000)
    expect(context.error.value).toBeInstanceOf(TypeError)
    expect(context.detail.value).toEqual(waiting)

    await vi.advanceTimersByTimeAsync(1000)
    expect(context.error.value).toBeNull()
    scope.stop()
  })

  it('화면을 떠나면 멈춘다', async () => {
    vi.mocked(getTask).mockResolvedValue(waiting)
    const { scope } = start()
    await vi.advanceTimersByTimeAsync(0)
    scope.stop()

    await vi.advanceTimersByTimeAsync(5000)
    expect(getTask).toHaveBeenCalledTimes(1)
  })

  it('refresh는 진행 중인 요청이 끝난 뒤 한 번 더 받는다 (제출 직후 옛 상태 방지)', async () => {
    let resolveFirst!: (value: TaskDetail) => void
    vi.mocked(getTask)
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValue(done)
    const { context, scope } = start()

    const refreshed = context.refresh()
    resolveFirst(waiting)
    await refreshed
    expect(getTask).toHaveBeenCalledTimes(2)
    expect(context.detail.value?.task.status).toBe('DONE')
    scope.stop()
  })
})
