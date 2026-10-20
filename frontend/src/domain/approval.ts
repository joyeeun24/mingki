import type { RequirementDecision } from './requirement'
import type { User } from './user'

export type ApprovalStep = 'REQUIREMENTS' | 'REVIEW'

/** APPROVE: 승인, REJECT: 거절, REQUEST_CHANGES: 코멘트로 수정 요청 */
export type ReviewDecision = 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES'

interface ApprovalBase {
  id: number
  approverId: number
  approver: User // 결정한 사람
  comment: string | null
  createdAt: string // ISO 8601
}

/** ① 요건 확정은 하나라도 확정하면 CONFIRMED, 전부 보류면 HELD. 요건별 결과는 Requirement.status */
export type Approval =
  | (ApprovalBase & { step: 'REQUIREMENTS'; decision: RequirementDecision })
  | (ApprovalBase & { step: 'REVIEW'; decision: ReviewDecision })
