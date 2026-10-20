// 가짜 서버의 저장 부분. 작업마다 사람이 한 일(TaskEvents)을 저장소 한 키에 둔다.
// 브라우저는 localStorage, 테스트는 memoryStorage(). 이 파일은 localStorage를 직접 만지지 않는다.
import type { TaskEvents } from './scenario'

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

// 저장 모양이 바뀌면 v를 올린다. 옛 모양이 남아 있어도 읽지 않게 하기 위해
const KEY = 'rr.mock.tasks.v1'

export function memoryStorage(): KeyValueStorage {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isTaskEvents(value: unknown): value is TaskEvents {
  if (!isObject(value) || !isObject(value.filenames)) return false
  const { requirements, review } = value
  return (
    typeof value.uploadedAt === 'number' &&
    typeof value.requesterId === 'number' &&
    typeof value.title === 'string' &&
    (requirements === null || (isObject(requirements) && isObject(requirements.decisions))) &&
    (review === null || (isObject(review) && typeof review.at === 'number'))
  )
}

export interface MockStore {
  get(taskId: string): TaskEvents | undefined
  put(taskId: string, events: TaskEvents): void
  reset(): void
}

export function createStore(storage: KeyValueStorage): MockStore {
  // 요청마다 다시 읽는다. 담당자 · 개발자 창 두 개가 같은 작업을 보기 때문
  function readAll(): Record<string, TaskEvents> {
    try {
      const parsed: unknown = JSON.parse(storage.getItem(KEY) ?? '{}')
      if (!isObject(parsed)) return {}
      return Object.fromEntries(
        Object.entries(parsed).filter(([, v]) => isTaskEvents(v)),
      ) as Record<string, TaskEvents>
    } catch {
      return {}
    }
  }

  return {
    get: (taskId) => readAll()[taskId],
    put: (taskId, events) =>
      storage.setItem(KEY, JSON.stringify({ ...readAll(), [taskId]: events })),
    reset: () => storage.removeItem(KEY),
  }
}
