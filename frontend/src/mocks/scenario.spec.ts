// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { SCHEDULE as S, type TaskEvents, scenario } from './scenario'

const ID = 't-1'
const T0 = 1_000_000

const uploaded: TaskEvents = { uploadedAt: T0, confirmedAt: null, approvedAt: null }
const confirmed: TaskEvents = { ...uploaded, confirmedAt: T0 + 10_000 }
const approved: TaskEvents = { ...confirmed, approvedAt: T0 + 60_000 }

const afterConfirm = (ms: number) => scenario(ID, confirmed, confirmed.confirmedAt! + ms)

describe('scenario: 시각으로 단계와 데이터를 계산한다', () => {
  it('업로드 직후에는 추출 중이고 아무것도 보이지 않는다', () => {
    const s = scenario(ID, uploaded, T0 + S.extracting - 1)
    expect(s.task).toMatchObject({ id: ID, status: 'EXTRACTING', verifyRound: 0 })
    expect(s.requirements).toEqual([])
    expect(s.pendingAction).toBeNull()
    expect(s.approvals).toEqual([])
  })

  it('추출이 끝나면 요건 확정 대기에서 멈추고, 요건은 확정 전 상태다', () => {
    const s = scenario(ID, uploaded, T0 + S.extracting)
    expect(s.task.status).toBe('WAITING_REQUIREMENT_APPROVAL')
    expect(s.requirements).toHaveLength(3)
    expect(s.requirements.every((r) => r.status === 'PROPOSED')).toBe(true)
    expect(s.pendingAction).toEqual({
      step: 'REQUIREMENTS',
      role: 'OFFICER',
      path: `/tasks/${ID}/requirements`,
    })
    // 아무리 기다려도 사람이 확정하기 전엔 넘어가지 않는다
    expect(scenario(ID, uploaded, T0 + 10 * 60_000).task.status).toBe(
      'WAITING_REQUIREMENT_APPROVAL',
    )
  })

  it('확정 뒤 자동 단계를 시간표대로 지난다', () => {
    const at = (ms: number) => afterConfirm(ms).task
    expect(at(0)).toMatchObject({ status: 'LOCATING', verifyRound: 0 })
    expect(at(S.locating)).toMatchObject({ status: 'DESIGNING', verifyRound: 0 })
    const v1 = S.locating + S.designing
    expect(at(v1)).toMatchObject({ status: 'VERIFYING', verifyRound: 1 })
    const d2 = v1 + S.verifying1
    expect(at(d2)).toMatchObject({ status: 'DESIGNING', verifyRound: 1 })
    const v2 = d2 + S.redesigning
    expect(at(v2)).toMatchObject({ status: 'VERIFYING', verifyRound: 2 })
    expect(at(v2 + S.verifying2)).toMatchObject({ status: 'WAITING_REVIEW', verifyRound: 2 })
  })

  it('확정하면 요건이 확정 상태가 되고 승인 기록이 생긴다', () => {
    const s = afterConfirm(0)
    expect(s.requirements.every((r) => r.status === 'CONFIRMED')).toBe(true)
    expect(s.approvals).toHaveLength(1)
    expect(s.approvals[0]).toMatchObject({ step: 'REQUIREMENTS', decision: 'CONFIRM' })
    expect(s.changeSpecs).toEqual([]) // 탐색 중에는 아직 없다
    expect(afterConfirm(S.locating).changeSpecs).toHaveLength(21)
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
    const s = afterConfirm(60_000)
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
    const publishing = scenario(ID, approved, approved.approvedAt! + S.publishing - 1)
    expect(publishing.task.status).toBe('PUBLISHING')
    expect(publishing.canApprove).toBe(false)
    expect(publishing.deliveries).toEqual([])

    const done = scenario(ID, approved, approved.approvedAt! + S.publishing)
    expect(done.task).toMatchObject({ status: 'DONE', currentNode: 'report' })
    expect(done.pendingAction).toBeNull()
    expect(done.approvals.map((a) => a.step)).toEqual(['REQUIREMENTS', 'REVIEW'])
    expect(done.deliveries).toHaveLength(9)
    expect(done.report?.markdown).toContain('# 개발 변경 명세서')
    expect(done.evaluation?.keywordBaseline.missed).toContain('S3')
  })
})
