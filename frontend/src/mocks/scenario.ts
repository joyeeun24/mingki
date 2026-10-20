// 가짜 서버의 계산 부분. 사람이 한 일(업로드 · 요건 확정 · 승인)과 지금 시각만으로
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
  RequirementDecision,
  TaskStatus,
  TestCase,
  User,
} from '@/domain'

import * as fixture from './fixtures/creditLoan'
import { users } from './fixtures/users'

/** 사람이 한 일. 시각은 ms. 요건 확정 전엔 확정 대기에서, 승인 전엔 검토 대기에서 멈춘다 */
export interface TaskEvents {
  uploadedAt: number
  requesterId: number
  title: string
  filenames: { old: string; new: string }
  requirements: {
    at: number
    by: number // userId
    decisions: Record<number, RequirementDecision> // requirementId → 결정
    comment: string | null
  } | null
  review: { at: number; by: number; comment: string | null } | null
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
  node: string // 백엔드 currentNode와 같은 값
  startedAt: number // 이 단계가 시작된 시각 → task.updatedAt
  verifyRound: number
  verifying: boolean // 현재 회차 패치가 아직 검증 중
  showSpecs: boolean
  finished: boolean
}

function phaseOf(events: TaskEvents, now: number): Phase {
  const S = SCHEDULE
  const idle = { verifyRound: 0, verifying: false, showSpecs: false, finished: false }

  if (now - events.uploadedAt < S.extracting) {
    return {
      ...idle,
      status: 'EXTRACTING',
      node: 'requirement_agent',
      startedAt: events.uploadedAt,
    }
  }
  const decided = events.requirements
  if (decided === null) {
    const startedAt = events.uploadedAt + S.extracting
    return {
      ...idle,
      status: 'WAITING_REQUIREMENT_APPROVAL',
      node: 'interrupt_requirements',
      startedAt,
    }
  }
  if (!Object.values(decided.decisions).includes('CONFIRMED')) {
    return { ...idle, status: 'HELD', node: 'interrupt_requirements', startedAt: decided.at }
  }

  const specs = { ...idle, showSpecs: true }
  const steps: [duration: number, phase: Omit<Phase, 'startedAt'>][] = [
    [S.locating, { ...idle, status: 'LOCATING', node: 'locate_agent' }],
    [S.designing, { ...specs, status: 'DESIGNING', node: 'design_agent' }],
    [
      S.verifying1,
      { ...specs, status: 'VERIFYING', node: 'verify', verifyRound: 1, verifying: true },
    ],
    [S.redesigning, { ...specs, status: 'DESIGNING', node: 'design_agent', verifyRound: 1 }],
    [
      S.verifying2,
      { ...specs, status: 'VERIFYING', node: 'verify', verifyRound: 2, verifying: true },
    ],
  ]
  let startedAt = decided.at
  for (const [duration, phase] of steps) {
    if (now < startedAt + duration) return { ...phase, startedAt }
    startedAt += duration
  }

  const reviewed = { ...specs, verifyRound: MAX_VERIFY_ROUNDS }
  const review = events.review
  if (review === null) {
    return { ...reviewed, status: 'WAITING_REVIEW', node: 'interrupt_review', startedAt }
  }
  if (now - review.at < S.publishing) {
    return { ...reviewed, status: 'PUBLISHING', node: 'publish', startedAt: review.at }
  }
  const doneAt = review.at + S.publishing
  return { ...reviewed, status: 'DONE', node: 'report', startedAt: doneAt, finished: true }
}

function iso(ms: number) {
  return new Date(ms).toISOString()
}

function userById(userId: number): User {
  const user = users.find((u) => u.userId === userId)
  if (!user) throw new Error(`알 수 없는 사용자 ${userId}`)
  return user
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

/** 보이는 회차까지만 남기고, (묶음, 파일)마다 가장 최근 회차를 latest로, 검증 중인 회차는 PENDING으로 */
function visiblePatches(phase: Phase): CodePatch[] {
  const visible = fixture.patches.filter((p) => p.round <= phase.verifyRound)
  const key = (p: CodePatch) => `${p.bundle}::${p.filePath}`
  const latestRound = new Map<string, number>()
  for (const p of visible) latestRound.set(key(p), Math.max(latestRound.get(key(p)) ?? 0, p.round))
  return visible.map((p) => {
    const pending = phase.verifying && p.round === phase.verifyRound
    return {
      ...p,
      latest: latestRound.get(key(p)) === p.round,
      verifyStatus: pending ? 'PENDING' : p.verifyStatus,
      verifyLog: pending ? null : p.verifyLog,
      failureKind: pending ? null : p.failureKind,
    }
  })
}

function approvalsOf(events: TaskEvents): Approval[] {
  const approvals: Approval[] = []
  const decided = events.requirements
  if (decided) {
    const confirmed = Object.values(decided.decisions).includes('CONFIRMED')
    approvals.push({
      id: 1,
      step: 'REQUIREMENTS',
      decision: confirmed ? 'CONFIRMED' : 'HELD',
      approverId: decided.by,
      approver: userById(decided.by),
      comment: decided.comment,
      createdAt: iso(decided.at),
    })
  }
  if (events.review) {
    approvals.push({
      id: 2,
      step: 'REVIEW',
      decision: 'APPROVE',
      approverId: events.review.by,
      approver: userById(events.review.by),
      comment: events.review.comment,
      createdAt: iso(events.review.at),
    })
  }
  return approvals
}

export function scenario(taskId: string, events: TaskEvents, now: number): Snapshot {
  const phase = phaseOf(events, now)
  const decisions = events.requirements?.decisions ?? {}

  const task: AnalysisTask = {
    ...fixture.task,
    id: taskId,
    title: events.title,
    status: phase.status,
    currentNode: phase.node,
    verifyRound: phase.verifyRound,
    requesterId: events.requesterId,
    createdAt: iso(events.uploadedAt),
    updatedAt: iso(phase.startedAt),
  }
  const [oldDoc, newDoc] = fixture.documents
  const documents = [
    { ...oldDoc!, filename: events.filenames.old },
    { ...newDoc!, filename: events.filenames.new },
  ]
  const requirements =
    phase.status === 'EXTRACTING'
      ? []
      : fixture.requirements.map((r) => ({ ...r, status: decisions[r.id] ?? 'PROPOSED' }))
  const patches = visiblePatches(phase)
  const latest = patches.filter((p) => p.latest)
  const deliveries = phase.finished
    ? fixture.deliveries.map((d) => ({ ...d, createdAt: iso(phase.startedAt) }))
    : []

  return {
    task,
    documents,
    pendingAction: derivePendingAction(phase.status, taskId),
    requirements,
    changeSpecs: phase.showSpecs ? fixture.changeSpecs : [],
    testCases: phase.showSpecs ? fixture.testCases : [],
    patches,
    canApprove:
      phase.status === 'WAITING_REVIEW' &&
      latest.length > 0 &&
      latest.every((p) => p.verifyStatus === 'PASSED'),
    approvals: approvalsOf(events),
    deliveries,
    report: phase.finished ? fixture.report : null,
    evaluation: phase.finished ? fixture.evaluation : null,
  }
}
