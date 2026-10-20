// @vitest-environment node
// jsdom에서는 FormData와 fetch 구현이 달라 업로드가 깨진다. 그래서 node 환경에서 돌린다
import { setupServer } from 'msw/node'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import v3 from '../../../data/regulations/credit-loan-ops/v3.md?raw'
import v4 from '../../../data/regulations/credit-loan-ops/v4.md?raw'

import { login } from './auth'
import { ApiError, request, setToken } from './client'
import {
  approveRequirements,
  createTask,
  getChangeSpecs,
  getEvaluation,
  getPatches,
  getReport,
  getRequirements,
  getTask,
  reviewPatches,
} from './tasks'
import type { RequirementDecision } from '@/domain'
import { createHandlers } from '@/mocks/handlers'
import { SCHEDULE as S } from '@/mocks/scenario'
import { createStore, memoryStorage } from '@/mocks/store'

// 가짜 타이머 대신 시계를 직접 넘긴다. fetch는 실제 타이머를 쓰기 때문
let clock = 1_000_000
const wait = (ms: number) => void (clock += ms)
const AUTO_STEPS = S.locating + S.designing + S.verifying1 + S.redesigning + S.verifying2

const store = createStore(memoryStorage())
const server = setupServer(...createHandlers({ store, now: () => clock, delayMs: 0 }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
beforeEach(() => {
  setToken(null)
  store.reset()
})

async function loginAs(username: string) {
  const me = await login({ username, password: 'password' })
  setToken(me.token)
  return me
}

const file = (text: string, name: string) => new File([text], name)

async function upload(oldFile = file(v3, 'v3.md'), newFile = file(v4, 'v4.md')) {
  await loginAs('officer1')
  return createTask({ oldFile, newFile })
}

async function decideAll(taskId: string, decision: RequirementDecision) {
  const { requirements } = await getRequirements(taskId)
  return approveRequirements(taskId, {
    decisions: requirements.map((r) => ({ requirementId: r.id, decision })),
  })
}

async function expectError(promise: Promise<unknown>, status: number, message?: string) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  )
  expect(error).toBeInstanceOf(ApiError)
  expect((error as ApiError).status).toBe(status)
  if (message) expect((error as ApiError).message).toContain(message)
}

describe('데모 흐름: API 함수 → 가짜 서버', () => {
  it('로그인부터 완료까지 끝까지 간다', async () => {
    const officer = await loginAs('officer1')
    expect(officer).toMatchObject({ displayName: '김준법', role: 'OFFICER' })

    const created = await createTask({ oldFile: file(v3, 'v3.md'), newFile: file(v4, 'v4.md') })
    expect(created.status).toBe('EXTRACTING')
    const id = created.taskId

    wait(S.extracting)
    const waiting = await getTask(id)
    expect(waiting.task).toMatchObject({
      title: '개인신용대출 운영기준 v3 → v4',
      status: 'WAITING_REQUIREMENT_APPROVAL',
    })
    expect(waiting.pendingAction).toMatchObject({ step: 'REQUIREMENTS', role: 'OFFICER' })
    expect(waiting.documents.map((d) => [d.side, d.filename])).toEqual([
      ['OLD', 'v3.md'],
      ['NEW', 'v4.md'],
    ])
    const { requirements } = await getRequirements(id)
    expect(requirements.map((r) => r.status)).toEqual(['PROPOSED', 'PROPOSED', 'PROPOSED'])

    const confirmed = await decideAll(id, 'CONFIRMED')
    expect(confirmed).toMatchObject({
      step: 'REQUIREMENTS',
      decision: 'CONFIRMED',
      approver: { displayName: '김준법' },
    })
    // 백엔드는 리포트가 없으면 {}를 보내고, API 함수가 null로 바꾼다
    expect((await getReport(id)).report).toBeNull()
    expect((await getEvaluation(id)).evaluation).toBeNull()

    wait(AUTO_STEPS)
    const specs = await getChangeSpecs(id)
    expect([specs.targets.length, specs.nonTargets.length]).toEqual([12, 9])
    const review = await getPatches(id)
    expect(review).toMatchObject({
      latestRound: 2,
      passed: 5,
      failed: 0,
      pending: 0,
      canApprove: true,
    })
    expect(review.testCases).toHaveLength(8)

    await loginAs('dev1')
    const approved = await reviewPatches(id, { decision: 'APPROVE' })
    expect(approved).toMatchObject({
      step: 'REVIEW',
      decision: 'APPROVE',
      approver: { displayName: '이개발' },
    })

    wait(S.publishing)
    const done = await getTask(id)
    expect(done.task.status).toBe('DONE')
    expect(done.pendingAction).toBeNull()
    expect(done.approvals).toHaveLength(2)
    expect(done.deliveries).toHaveLength(9)
    expect((await getReport(id)).report?.markdown).toContain('# 개발 변경 명세서')
    expect((await getEvaluation(id)).evaluation?.trapErrors).toBe(0)
  })

  it('요건을 전부 보류하면 보류로 종료된다', async () => {
    const { taskId } = await upload()
    wait(S.extracting)
    expect(await decideAll(taskId, 'HELD')).toMatchObject({ decision: 'HELD' })
    wait(60_000)
    expect((await getTask(taskId)).task.status).toBe('HELD')
  })
})

describe('가짜 서버 검사 규칙: 백엔드와 같은 상태 코드 · 문구', () => {
  it('로그인 안 함 401, 로그인 실패 401', async () => {
    await expectError(getTask('any'), 401, '인증이 필요합니다')
    await expectError(
      login({ username: 'officer1', password: 'wrong' }),
      401,
      'invalid credentials',
    )
  })

  it('없는 작업 404', async () => {
    await loginAs('officer1')
    await expectError(getTask('no-such-task'), 404, 'task not found')
  })

  it('업로드 파일 검사: 같은 내용, 확장자, 1MB 초과', async () => {
    await expectError(
      upload(file(v3, 'a.md'), file(v3, 'b.md')),
      400,
      '신·구 규정 파일 내용이 같습니다',
    )
    await expectError(upload(file(v3, 'v3.md'), file(v4, 'v4.pdf')), 400, 'newFile 는 .md / .txt')
    const big = file('x'.repeat(1024 * 1024 + 1), 'big.md')
    await expectError(upload(big, file(v4, 'v4.md')), 413, '1MB 이하')
  })

  it('요건 확정: 개발자 403, 추출 중 409, 결정 누락 400, 옛 이름 400', async () => {
    const { taskId } = await upload()
    await expectError(decideAll(taskId, 'CONFIRMED'), 409, '작업 상태가 EXTRACTING 입니다')

    wait(S.extracting)
    await loginAs('dev1')
    await expectError(decideAll(taskId, 'CONFIRMED'), 403)

    await loginAs('officer1')
    const { requirements } = await getRequirements(taskId)
    await expectError(
      approveRequirements(taskId, {
        decisions: [{ requirementId: requirements[0]!.id, decision: 'CONFIRMED' }],
      }),
      400,
      '요건 R2(id 2)에 대한 결정이 없습니다',
    )
    // 백엔드 #7 전 이름. 백엔드는 JSON을 읽는 단계에서 막는다
    await expectError(
      decideAll(taskId, 'CONFIRM' as RequirementDecision),
      400,
      '요청 본문을 읽을 수 없습니다',
    )
  })

  it('검토: 담당자 403, 대기 전 409, 거절은 가짜 서버 범위 밖 501', async () => {
    const { taskId } = await upload()
    wait(S.extracting)
    await decideAll(taskId, 'CONFIRMED')
    await expectError(reviewPatches(taskId, { decision: 'APPROVE' }), 403)

    await loginAs('dev1')
    await expectError(reviewPatches(taskId, { decision: 'APPROVE' }), 409, '필요: WAITING_REVIEW')
    wait(AUTO_STEPS)
    await expectError(reviewPatches(taskId, { decision: 'REJECT' }), 501)
  })

  it('흉내 내지 않는 주소는 501', async () => {
    await loginAs('officer1')
    await expectError(request('/ai/tasks'), 501, '데모 범위 밖')
  })
})
