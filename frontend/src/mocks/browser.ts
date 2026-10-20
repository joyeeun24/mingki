import { setupWorker } from 'msw/browser'

import { createHandlers } from './handlers'
import { createStore } from './store'

const store = createStore(localStorage)

export const worker = setupWorker(...createHandlers({ store, now: Date.now, delayMs: 150 }))

/** 데모 초기화: 가짜 서버에 기록된 작업을 모두 지운다 */
export function resetMock() {
  store.reset()
}
