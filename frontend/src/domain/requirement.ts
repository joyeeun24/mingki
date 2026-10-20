/** PROPOSED: 확정 전, CONFIRMED: 확정, HELD: 보류 */
export type RequirementStatus = 'PROPOSED' | 'CONFIRMED' | 'HELD'

/** 요건 확정에서 고르는 값. 요청과 승인 기록(Approval.decision)에 같은 이름을 쓴다 */
export type RequirementDecision = Exclude<RequirementStatus, 'PROPOSED'>

/** requirement_agent가 신 · 구 조항을 비교해 뽑은 요건 */
export interface Requirement {
  id: number
  reqKey: string // 예: R1. 영향 위치 · 테스트가 이 키로 요건을 가리킨다
  summary: string // 바뀐 내용, 예: 고령자 기준 만 65세 → 만 60세
  target: string | null // 적용 대상
  effectiveDate: string | null // 시행일, YYYY-MM-DD
  transitional: string | null // 경과조치
  articleRef: string | null // 근거 조항, 예: 제15조
  oldText: string | null // 바뀌기 전 원문, 신설이면 null
  newText: string | null // 바뀐 후 원문, 삭제면 null
  status: RequirementStatus
}
