// 백엔드 공개 API의 요청 · 응답 모양 (BACKEND_API.md 3 · 5절).
// 항목은 도메인 타입 그대로이고, 자유 형식 칸(detail · payload · counts)은 받지 않는다.
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
  ReviewDecision,
  Role,
  TaskStatus,
  TestCase,
} from '@/domain'

export interface ApiErrorBody {
  error: string // 예: CONFLICT
  message: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  userId: number
  username: string
  displayName: string
  role: Role
}

export interface CreateTaskRequest {
  oldFile: File
  newFile: File
  title?: string
}

export interface TaskCreated {
  taskId: string
  status: TaskStatus
}

export interface TaskDetail {
  task: AnalysisTask
  errorMessage: string | null
  maxVerifyRounds: number
  documents: RegulationDocument[]
  pendingAction: PendingAction | null
  approvals: Approval[]
  deliveries: Delivery[]
}

export interface RequirementsResponse {
  task: AnalysisTask
  documents: RegulationDocument[]
  requirements: Requirement[]
}

/** 요청은 CONFIRMED · HELD, 응답(Approval.decision)은 CONFIRM · HOLD. 백엔드가 그렇게 나뉜다 */
export type RequirementDecision = 'CONFIRMED' | 'HELD'

export interface ApproveRequirementsRequest {
  decisions: { requirementId: number; decision: RequirementDecision }[] // 모든 요건에 결정 필요
  comment?: string
}

export interface ChangeSpecsResponse {
  task: AnalysisTask
  targets: ChangeSpec[]
  nonTargets: ChangeSpec[]
}

export interface PatchesResponse {
  task: AnalysisTask
  maxVerifyRounds: number
  latestRound: number
  passed: number
  failed: number
  pending: number
  canApprove: boolean // false면 화면에서도 승인 버튼을 막는다
  patches: CodePatch[] // 회차 전체, 현재 것은 latest: true
  testCases: TestCase[]
}

export interface ReviewRequest {
  decision: ReviewDecision
  comment?: string // REQUEST_CHANGES면 필수
  excludedSpecKeys?: string[]
}

export interface ReportResponse {
  task: AnalysisTask
  report: Report | null
  deliveries: Delivery[]
}

export interface EvaluationResponse {
  task: AnalysisTask
  evaluation: Evaluation | null
}
