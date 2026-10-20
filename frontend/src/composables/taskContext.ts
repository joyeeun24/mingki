import { inject, type InjectionKey, type Ref, type ShallowRef } from 'vue'

import type { TaskDetail } from '@/api/types'

/** 작업 레이아웃이 자식 화면에 넘기는 것. 폴링은 레이아웃 한 곳에서만 한다 */
export interface TaskContext {
  detail: Readonly<ShallowRef<TaskDetail | null>>
  notFound: Readonly<Ref<boolean>>
  error: Readonly<Ref<unknown>> // 마지막 폴링 오류. 있으면 이전 데이터를 보여주는 중
  /** 지금 상태를 다시 받는다. 진행 중인 요청이 있으면 그것이 끝난 뒤 한 번 더 받는다 */
  refresh: () => Promise<void>
}

export const TASK_CONTEXT: InjectionKey<TaskContext> = Symbol('task')

export function useTaskContext(): TaskContext {
  const context = inject(TASK_CONTEXT)
  if (!context) throw new Error('작업 화면은 TaskLayout 안에서만 쓸 수 있습니다')
  return context
}
