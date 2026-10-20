// scenario 계산 결과를 백엔드 응답 모양으로 바꾼다. 가짜 서버와 화면 테스트가 같이 쓴다
import type {
  ChangeSpecsResponse,
  PatchesResponse,
  RequirementsResponse,
  TaskDetail,
} from '@/api/types'

import { MAX_VERIFY_ROUNDS, type Snapshot } from './scenario'

export function taskDetail(s: Snapshot): TaskDetail {
  return {
    task: s.task,
    errorMessage: null,
    maxVerifyRounds: MAX_VERIFY_ROUNDS,
    documents: s.documents,
    pendingAction: s.pendingAction,
    approvals: s.approvals,
    deliveries: s.deliveries,
  }
}

export function requirementsResponse(s: Snapshot): RequirementsResponse {
  return { task: s.task, documents: s.documents, requirements: s.requirements }
}

export function changeSpecsResponse(s: Snapshot): ChangeSpecsResponse {
  return {
    task: s.task,
    targets: s.changeSpecs.filter((c) => c.target),
    nonTargets: s.changeSpecs.filter((c) => !c.target),
  }
}

/** 통과 · 실패 · 검증 중 수는 현재 회차(latest) 패치 기준 (백엔드와 같음) */
export function patchesResponse(s: Snapshot): PatchesResponse {
  const latest = s.patches.filter((p) => p.latest)
  const passed = latest.filter((p) => p.verifyStatus === 'PASSED').length
  const failed = latest.filter((p) => p.verifyStatus === 'FAILED').length
  return {
    task: s.task,
    maxVerifyRounds: MAX_VERIFY_ROUNDS,
    latestRound: Math.max(0, ...s.patches.map((p) => p.round)),
    passed,
    failed,
    pending: latest.length - passed - failed,
    canApprove: s.canApprove,
    patches: s.patches,
    testCases: s.testCases,
  }
}
