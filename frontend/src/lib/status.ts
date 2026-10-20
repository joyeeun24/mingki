import type { TaskStatus } from '@/domain'

/** 더 이상 바뀌지 않는 상태. 폴링을 멈춘다 */
export const TERMINAL_STATUSES: ReadonlySet<TaskStatus> = new Set([
  'DONE',
  'NO_CHANGE',
  'HELD',
  'REJECTED',
  'FAILED',
])

/** 사람이 할 일을 기다리는 상태 */
export const WAITING_STATUSES: ReadonlySet<TaskStatus> = new Set([
  'WAITING_REQUIREMENT_APPROVAL',
  'WAITING_REVIEW',
])
