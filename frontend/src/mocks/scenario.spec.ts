// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { SCHEDULE as S, type TaskEvents, scenario } from './scenario'

const ID = 't-1'
const T0 = 1_000_000
const OFFICER = 1 // officer1 김준법
const DEV = 3 // dev1 이개발

const uploaded: TaskEvents = {
  uploadedAt: T0,
  requesterId: OFFICER,
  title: '개인신용대출 운영기준 v3 → v4',
  filenames: { old: 'v3.md', new: 'v4.md' },
  requirements: null,
  review: null,
}
type Decisions = NonNullable<TaskEvents['requirements']>['decisions']

const decide = (decisions: Decisions): TaskEvents => ({
  ...uploaded,
  requirements: { at: T0 + 10_000, by: OFFICER, decisions, comment: null },
})
const confirmed = decide({ 1: 'CONFIRMED', 2: 'CONFIRMED', 3: 'CONFIRMED' })
const approved: TaskEvents = { ...confirmed, review: { at: T0 + 60_000, by: DEV, comment: '확인' } }

const afterConfirm = (ms: number) => scenario(ID, confirmed, confirmed.requirements!.at + ms)
const toReview = S.locating + S.designing + S.verifying1 + S.redesigning + S.verifying2

describe('scenario: 사람이 한 일과 시각으로 단계와 데이터를 계산한다', () => {
  it('업로드 직후에는 추출 중이고 아무것도 보이지 않는다', () => {
    const s = scenario(ID, uploaded, T0 + S.extracting - 1)
    expect(s.task).toMatchObject({
      id: ID,
      status: 'EXTRACTING',
      verifyRound: 0,
      requesterId: OFFICER,
    })
    expect(s.documents.map((d) => d.filename)).toEqual(['v3.md', 'v4.md'])
    expect(s.requirements).toEqual([])
    expect(s.pendingAction).toBeNull()
    expect(s.approvals).toEqual([])
  })

  it('추출이 끝나면 요건 확정 대기에서 멈추고, 요건은 확정 전 상태다', () => {
    const s = scenario(ID, uploaded, T0 + S.extracting)
    expect(s.task).toMatchObject({
      status: 'WAITING_REQUIREMENT_APPROVAL',
      currentNode: 'interrupt_requirements',
    })
    expect(s.requirements).toHaveLength(3)
    expect(s.requirements.every((r) => r.status === 'PROPOSED')).toBe(true)
    expect(s.pendingAction).toEqual({
      step: 'REQUIREMENTS',
      role: 'OFFICER',
      path: `/tasks/${ID}/requirements`,
    })
    // 사람이 확정하기 전엔 넘어가지 않고, 멈춘 동안 updatedAt도 바뀌지 않는다
    const later = scenario(ID, uploaded, T0 + 10 * 60_000)
    expect(later.task.status).toBe('WAITING_REQUIREMENT_APPROVAL')
    expect(later.task.updatedAt).toBe(s.task.updatedAt)
  })

  it('확정 뒤 자동 단계를 시간표대로 지난다', () => {
    const at = (ms: number) => afterConfirm(ms).task
    expect(at(0)).toMatchObject({ status: 'LOCATING', verifyRound: 0 })
    expect(at(S.locating)).toMatchObject({ status: 'DESIGNING', verifyRound: 0 })
    const v1 = S.locating + S.designing
    expect(at(v1)).toMatchObject({ status: 'VERIFYING', verifyRound: 1, currentNode: 'verify' })
    const d2 = v1 + S.verifying1
    expect(at(d2)).toMatchObject({ status: 'DESIGNING', verifyRound: 1 })
    expect(at(d2 + S.redesigning)).toMatchObject({ status: 'VERIFYING', verifyRound: 2 })
    expect(at(toReview)).toMatchObject({
      status: 'WAITING_REVIEW',
      verifyRound: 2,
      currentNode: 'interrupt_review',
    })
  })

  it('확정하면 요건이 결정대로 바뀌고, 확정한 사람이 승인 기록에 남는다', () => {
    const s = afterConfirm(0)
    expect(s.requirements.every((r) => r.status === 'CONFIRMED')).toBe(true)
    expect(s.approvals).toHaveLength(1)
    expect(s.approvals[0]).toMatchObject({
      step: 'REQUIREMENTS',
      decision: 'CONFIRMED',
      approverId: OFFICER,
      approver: { displayName: '김준법', role: 'OFFICER' },
    })
    expect(s.changeSpecs).toEqual([]) // 탐색 중에는 아직 없다
    expect(afterConfirm(S.locating).changeSpecs).toHaveLength(21)
  })

  it('일부만 보류하면 그 요건만 보류로 표시하고 계속 진행한다', () => {
    const partial = decide({ 1: 'CONFIRMED', 2: 'HELD', 3: 'CONFIRMED' })
    const s = scenario(ID, partial, partial.requirements!.at)
    expect(s.requirements.map((r) => r.status)).toEqual(['CONFIRMED', 'HELD', 'CONFIRMED'])
    expect(s.task.status).toBe('LOCATING')
    expect(s.approvals[0]?.decision).toBe('CONFIRMED')
  })

  it('전부 보류하면 보류로 종료되고 더 진행하지 않는다', () => {
    const held = decide({ 1: 'HELD', 2: 'HELD', 3: 'HELD' })
    const s = scenario(ID, held, held.requirements!.at + 60_000)
    expect(s.task.status).toBe('HELD')
    expect(s.pendingAction).toBeNull()
    expect(s.approvals[0]?.decision).toBe('HELD')
    expect(s.changeSpecs).toEqual([])
    expect(s.patches).toEqual([])
    expect(s.report).toBeNull()
  })

  it('검증 중에는 현재 회차 패치가 PENDING이고, 끝나면 결과가 보인다', () => {
    const v1 = S.locating + S.designing
    const during = afterConfirm(v1)
    expect(during.patches.every((p) => p.round === 1 && p.latest)).toBe(true)
    expect(during.patches.every((p) => p.verifyStatus === 'PENDING' && p.verifyLog === null)).toBe(
      true,
    )
    expect(during.canApprove).toBe(false)

    const after = afterConfirm(v1 + S.verifying1)
    const eligibility = after.patches.find((p) => p.bundle === 'eligibility')
    expect(eligibility).toMatchObject({
      round: 1,
      verifyStatus: 'FAILED',
      failureKind: 'PATCH',
      latest: true,
    })
    expect(after.patches.filter((p) => p.verifyStatus === 'PASSED')).toHaveLength(4)
  })

  it('검토 대기에서는 2회차가 최신이고 승인할 수 있다', () => {
    const s = afterConfirm(toReview + 60_000)
    expect(s.task.status).toBe('WAITING_REVIEW')
    const eligibility = s.patches.filter((p) => p.bundle === 'eligibility')
    expect(eligibility.map((p) => [p.round, p.latest])).toEqual([
      [1, false],
      [2, true],
    ])
    expect(s.patches.filter((p) => p.latest).every((p) => p.verifyStatus === 'PASSED')).toBe(true)
    expect(s.canApprove).toBe(true)
    expect(s.pendingAction).toEqual({
      step: 'REVIEW',
      role: 'DEVELOPER',
      path: `/tasks/${ID}/review`,
    })
    expect(s.deliveries).toEqual([])
    expect(s.report).toBeNull()
  })

  it('승인하면 PR · 티켓 생성을 거쳐 완료되고 결과물이 보인다', () => {
    const publishing = scenario(ID, approved, approved.review!.at + S.publishing - 1)
    expect(publishing.task.status).toBe('PUBLISHING')
    expect(publishing.canApprove).toBe(false)
    expect(publishing.deliveries).toEqual([])

    const doneAt = approved.review!.at + S.publishing
    const done = scenario(ID, approved, doneAt)
    expect(done.task).toMatchObject({ status: 'DONE', currentNode: 'report' })
    expect(done.pendingAction).toBeNull()
    expect(done.canApprove).toBe(false)
    expect(done.approvals.map((a) => [a.step, a.decision, a.approver.displayName])).toEqual([
      ['REQUIREMENTS', 'CONFIRMED', '김준법'],
      ['REVIEW', 'APPROVE', '이개발'],
    ])
    expect(done.deliveries).toHaveLength(9)
    expect(done.deliveries.every((d) => d.createdAt === new Date(doneAt).toISOString())).toBe(true)
    expect(done.report?.markdown).toContain('# 개발 변경 명세서')
    expect(done.evaluation?.keywordBaseline.missed).toContain('S3')
  })
})
