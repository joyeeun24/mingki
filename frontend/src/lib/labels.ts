// 화면에 보이는 한국어 이름. Record라서 값이 하나라도 빠지면 타입 오류가 난다
import type {
  Approval,
  ApprovalStep,
  ChangeType,
  DeliveryKind,
  FailureKind,
  LocationKind,
  RequirementStatus,
  Role,
  TaskStatus,
  TestKind,
  VerifyStatus,
} from '@/domain'

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  EXTRACTING: '요건 추출 중',
  WAITING_REQUIREMENT_APPROVAL: '요건 확정 대기',
  LOCATING: '영향 위치 탐색 중',
  DESIGNING: '수정안 생성 중',
  VERIFYING: '검증 중',
  WAITING_REVIEW: '검토 · 승인 대기',
  PUBLISHING: 'PR · 티켓 생성 중',
  DONE: '완료',
  NO_CHANGE: '실질 변경 없음',
  HELD: '보류로 종료',
  REJECTED: '거절로 종료',
  FAILED: '시스템 오류',
}

export const ROLE_LABEL: Record<Role, string> = {
  OFFICER: '담당자',
  DEVELOPER: '개발자',
}

export const LOCATION_KIND_LABEL: Record<LocationKind, string> = {
  CODE: '코드',
  CONFIG: '설정 파일',
  DB: 'DB 스키마',
  PRODUCT: '상품 규칙',
  DOC: '문서',
  UI: '화면 문구',
}

export const CHANGE_TYPE_LABEL: Record<ChangeType, string> = {
  VALUE: '① 값',
  LOGIC: '② 로직',
  DB: '③ DB',
  NEW: '④ 신규',
}

export const TEST_KIND_LABEL: Record<TestKind, string> = {
  BOUNDARY: '경계값',
  EFFECTIVE_DATE: '시행일 전후',
  SYSTEM: '시스템',
  UNIT: '단위',
}

export const VERIFY_STATUS_LABEL: Record<VerifyStatus, string> = {
  PENDING: '검증 중',
  PASSED: '통과',
  FAILED: '실패',
}

export const FAILURE_KIND_LABEL: Record<FailureKind, string> = {
  PATCH: '패치 실패 → 수정안을 다시 만든다',
  SYSTEM_TEST: '시스템 테스트 실패 → 영향 위치를 다시 찾는다',
}

export const REQUIREMENT_STATUS_LABEL: Record<RequirementStatus, string> = {
  PROPOSED: '결정 전',
  CONFIRMED: '확정',
  HELD: '보류',
}

export const APPROVAL_STEP_LABEL: Record<ApprovalStep, string> = {
  REQUIREMENTS: '요건 확정',
  REVIEW: '검토 · 승인',
}

export const DECISION_LABEL: Record<Approval['decision'], string> = {
  CONFIRMED: '확정',
  HELD: '보류',
  APPROVE: '승인',
  REJECT: '거절',
  REQUEST_CHANGES: '수정 요청',
}

export const DELIVERY_KIND_LABEL: Record<DeliveryKind, string> = {
  PR: 'Draft PR',
  TICKET: '작업 티켓',
}
