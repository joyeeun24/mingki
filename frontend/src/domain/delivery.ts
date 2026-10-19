/** PR: Draft PR, TICKET: 작업 티켓 */
export type DeliveryKind = 'PR' | 'TICKET'

/** publish가 만든 결과물 */
export interface Delivery {
  id: number
  kind: DeliveryKind
  externalRef: string | null // 참조 번호, 예: RR-12
  url: string | null
  approvalId: number | null // 근거가 된 승인
  createdAt: string // ISO 8601
}
