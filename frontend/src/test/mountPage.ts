// 작업 화면 테스트 도우미. TaskLayout 없이 자식 화면만 띄우고, 작업 문맥은 직접 넣는다
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { vi } from 'vitest'
import { type Component, ref, shallowRef } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import type { TaskDetail } from '@/api/types'
import { TASK_CONTEXT, type TaskContext } from '@/composables/taskContext'
import type { User } from '@/domain'
import { users } from '@/mocks/fixtures/users'
import { SCHEDULE as S, type Snapshot, type TaskEvents, scenario } from '@/mocks/scenario'
import { routes } from '@/router'

export const OFFICER: User = users.find((u) => u.username === 'officer1')!
export const DEVELOPER: User = users.find((u) => u.username === 'dev1')!

const T0 = 1_000_000
const uploaded: TaskEvents = {
  uploadedAt: T0,
  requesterId: OFFICER.userId,
  title: '개인신용대출 운영기준 v3 → v4',
  filenames: { old: 'v3.md', new: 'v4.md' },
  requirements: null,
  review: null,
}
const confirmed: TaskEvents = {
  ...uploaded,
  requirements: {
    at: T0 + 10_000,
    by: OFFICER.userId,
    decisions: { 1: 'CONFIRMED', 2: 'CONFIRMED', 3: 'CONFIRMED' },
    comment: null,
  },
}

/** 가짜 서버와 같은 데이터. 단계: 요건 확정 대기 · 1회차 검증 중 · 검토 대기 */
export function demoSnapshot(stage: 'requirements' | 'verifying' | 'review'): Snapshot {
  if (stage === 'requirements') return scenario('t-1', uploaded, T0 + S.extracting)
  const at = confirmed.requirements!.at
  if (stage === 'verifying') return scenario('t-1', confirmed, at + S.locating + S.designing)
  return scenario('t-1', confirmed, at + 60_000)
}

export async function mountPage(
  component: Component,
  options: { user: User; detail: TaskDetail; path: string },
) {
  sessionStorage.clear()
  sessionStorage.setItem(
    'rr.auth',
    JSON.stringify({ token: `mock-${options.user.username}`, user: options.user }),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(options.path)
  await router.isReady()

  const context: TaskContext = {
    detail: shallowRef(options.detail),
    notFound: ref(false),
    error: ref(null),
    refresh: vi.fn(async () => {}),
  }
  const wrapper = mount(component, {
    global: { plugins: [pinia, router], provide: { [TASK_CONTEXT as symbol]: context } },
  })
  await flushPromises()
  return { wrapper, router, context }
}

export function buttonByText(wrapper: ReturnType<typeof mount>, text: string) {
  const button = wrapper.findAll('button').find((b) => b.text().trim() === text)
  if (!button) throw new Error(`'${text}' 버튼이 없습니다`)
  return button
}
