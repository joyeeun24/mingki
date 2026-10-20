import { onScopeDispose, ref, shallowRef } from 'vue'

import { ApiError } from '@/api/client'
import { getTask } from '@/api/tasks'
import type { TaskDetail } from '@/api/types'
import { TERMINAL_STATUSES } from '@/lib/status'

import type { TaskContext } from './taskContext'

/**
 * 작업 상태를 주기적으로 받는다. 요청은 한 번에 하나만 보낸다.
 * 화면을 떠나거나 · 작업이 없거나(404) · 끝난 상태면 멈춘다.
 * 가려진 창은 브라우저가 타이머를 늦추므로 다시 보이거나 포커스를 받으면 바로 받는다.
 */
export function useTaskPolling(taskId: string, intervalMs = 1000): TaskContext {
  const detail = shallowRef<TaskDetail | null>(null)
  const notFound = ref(false)
  const error = ref<unknown>(null)

  let inflight: Promise<void> | null = null
  let queued: Promise<void> | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let stopped = false

  async function fetchOnce() {
    try {
      detail.value = await getTask(taskId)
      error.value = null
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) notFound.value = true
      else error.value = e
    }
  }

  function refresh(): Promise<void> {
    // 진행 중인 요청은 제출 전에 보낸 것일 수 있으니, 끝난 뒤 한 번 더 받는다
    if (inflight) {
      queued ??= inflight.then(() => {
        queued = null
        return refresh()
      })
      return queued
    }
    inflight = fetchOnce().finally(() => {
      inflight = null
    })
    return inflight
  }

  function finished() {
    const status = detail.value?.task.status
    return notFound.value || (status !== undefined && TERMINAL_STATUSES.has(status))
  }

  async function tick() {
    await refresh()
    clearTimeout(timer)
    if (!stopped && !finished()) timer = setTimeout(tick, intervalMs)
  }

  function onVisible() {
    if (document.visibilityState !== 'visible' || stopped || finished()) return
    clearTimeout(timer)
    void tick()
  }

  void tick()
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', onVisible)

  onScopeDispose(() => {
    stopped = true
    clearTimeout(timer)
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('focus', onVisible)
  })

  return { detail, notFound, error, refresh }
}
