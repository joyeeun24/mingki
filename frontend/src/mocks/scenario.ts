// 가짜 서버의 핵심. 사람이 한 일(업로드 · 확정 · 승인)의 시각과 지금 시각만으로
// 작업이 어느 단계인지와 그 단계에서 보이는 데이터를 계산한다. 타이머가 없어서 새로고침 · 테스트에 강하다.
import type {
  AnalysisTask,
  Approval,
  ChangeSpec,
  CodePatch,
  Delivery,
  Evaluation,
  PendingAction,
  RegulationDocument,
  Report,
  Requirement,
  TaskStatus,
  TestCase,
} from '@/domain'

import * as fixture from './fixtures/creditLoan'

/** 사람이 한 일의 시각 (ms). 업로드만 있으면 요건 확정 대기에서, 확정까지 있으면 검토 대기에서 멈춘다 */
export interface TaskEvents {
  uploadedAt: number
  confirmedAt: number | null
  approvedAt: number | null
}

/** 자동 단계가 걸리는 시간 (ms). 발표 속도에 맞춰 여기만 고친다 */
export const SCHEDULE = {
  extracting: 3000,
  locating: 3000,
  designing: 3000,
  verifying1: 3000,
  redesigning: 2000,
  verifying2: 3000,
  publishing: 3000,
}

export const MAX_VERIFY_ROUNDS = 2

export interface Snapshot {
  task: AnalysisTask
  documents: RegulationDocument[]
  pendingAction: PendingAction | null
  requirements: Requirement[]
  changeSpecs: ChangeSpec[]
  testCases: TestCase[]
  patches: CodePatch[]
  canApprove: boolean
  approvals: Approval[]
  deliveries: Delivery[]
  report: Report | null
  evaluation: Evaluation | null
}

interface Phase {
  status: TaskStatus
  node: string
  verifyRound: number
  verifying: boolean // 현재 회차 패치가 아직 검증 중
  showSpecs: boolean
  finished: boolean
}

function phaseOf(events: TaskEvents, now: number): Phase {
  const S = SCHEDULE
  const base = { verifyRound: 0, verifying: false, showSpecs: false, finished: false }

  if (now - events.uploadedAt < S.extracting) {
    return { ...base, status: 'EXTRACTING', node: 'requirement_agent' }
  }
  if (events.confirmedAt === null) {
    return { ...base, status: 'WAITING_REQUIREMENT_APPROVAL', node: 'requirement_agent' }
  }

  const t = now - events.confirmedAt
  const steps: [until: number, phase: Phase][] = [
    [S.locating, { ...base, status: 'LOCATING', node: 'locate_agent' }],
    [S.designing, { ...base, status: 'DESIGNING', node: 'design_agent', showSpecs: true }],
    [
      S.verifying1,
      {
        status: 'VERIFYING',
        node: 'verify',
        verifyRound: 1,
        verifying: true,
        showSpecs: true,
        finished: false,
      },
    ],
    [
      S.redesigning,
      {
        status: 'DESIGNING',
        node: 'design_agent',
        verifyRound: 1,
        verifying: false,
        showSpecs: true,
        finished: false,
      },
    ],
    [
      S.verifying2,
      {
        status: 'VERIFYING',
        node: 'verify',
        verifyRound: 2,
        verifying: true,
        showSpecs: true,
        finished: false,
      },
    ],
  ]
  let until = 0
  for (const [duration, phase] of steps) {
    until += duration
    if (t < until) return phase
  }

  const reviewed = { verifyRound: 2, verifying: false, showSpecs: true, finished: false }
  if (events.approvedAt === null) return { ...reviewed, status: 'WAITING_REVIEW', node: 'verify' }
  if (now - events.approvedAt < S.publishing)
    return { ...reviewed, status: 'PUBLISHING', node: 'publish' }
  return { ...reviewed, status: 'DONE', node: 'report', finished: true }
}

function iso(ms: number) {
  return new Date(ms).toISOString()
}

export function derivePendingAction(status: TaskStatus, taskId: string): PendingAction | null {
  if (status === 'WAITING_REQUIREMENT_APPROVAL') {
    return { step: 'REQUIREMENTS', role: 'OFFICER', path: `/tasks/${taskId}/requirements` }
  }
  if (status === 'WAITING_REVIEW') {
    return { step: 'REVIEW', role: 'DEVELOPER', path: `/tasks/${taskId}/review` }
  }
  return null
}

/** 보이는 회차까지만 남기고, 묶음마다 가장 최근 회차를 latest로, 검증 중인 회차는 PENDING으로 */
function visiblePatches(phase: Phase): CodePatch[] {
  const visible = fixture.patches.filter((p) => p.round <= phase.verifyRound)
  const latestRound = new Map<string, number>()
  for (const p of visible)
    latestRound.set(p.bundle, Math.max(latestRound.get(p.bundle) ?? 0, p.round))
  return visible.map((p) => {
    const pending = phase.verifying && p.round === phase.verifyRound
    return {
      ...p,
      latest: latestRound.get(p.bundle) === p.round,
      verifyStatus: pending ? 'PENDING' : p.verifyStatus,
      verifyLog: pending ? null : p.verifyLog,
      failureKind: pending ? null : p.failureKind,
    }
  })
}

export function canApprove(patches: CodePatch[]): boolean {
  const latest = patches.filter((p) => p.latest)
  return latest.length > 0 && latest.every((p) => p.verifyStatus === 'PASSED')
}

export function scenario(taskId: string, events: TaskEvents, now: number): Snapshot {
  const phase = phaseOf(events, now)
  const extracted = phase.status !== 'EXTRACTING'
  const confirmed = events.confirmedAt !== null

  const task: AnalysisTask = {
    ...fixture.task,
    id: taskId,
    status: phase.status,
    currentNode: phase.node,
    verifyRound: phase.verifyRound,
    createdAt: iso(events.uploadedAt),
    updatedAt: iso(now),
  }

  const requirements = extracted
    ? fixture.requirements.map((r) => ({ ...r, status: confirmed ? r.status : 'PROPOSED' }))
    : []
  const patches = visiblePatches(phase)

  const approvals: Approval[] = []
  const [requirementApproval, reviewApproval] = fixture.approvals
  if (confirmed && requirementApproval) {
    approvals.push({ ...requirementApproval, createdAt: iso(events.confirmedAt!) })
  }
  if (events.approvedAt !== null && reviewApproval) {
    approvals.push({ ...reviewApproval, createdAt: iso(events.approvedAt) })
  }

  return {
    task,
    documents: fixture.documents,
    pendingAction: derivePendingAction(phase.status, taskId),
    requirements,
    changeSpecs: phase.showSpecs ? fixture.changeSpecs : [],
    testCases: phase.showSpecs ? fixture.testCases : [],
    patches,
    canApprove: phase.status === 'WAITING_REVIEW' && canApprove(patches),
    approvals,
    deliveries: phase.finished ? fixture.deliveries : [],
    report: phase.finished ? fixture.report : null,
    evaluation: phase.finished ? fixture.evaluation : null,
  }
}
