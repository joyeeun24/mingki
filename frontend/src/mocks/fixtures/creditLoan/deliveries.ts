import type { Delivery } from '@/domain'

const pr = (id: number, number: number): Delivery => ({
  id,
  kind: 'PR',
  externalRef: `#${number}`,
  url: `https://github.com/example/loan-core/pull/${number}`,
  approvalId: 2,
  createdAt: '2026-10-19T01:15:00Z',
})

const ticket = (id: number, number: number): Delivery => ({
  id,
  kind: 'TICKET',
  externalRef: `RR-${number}`,
  url: `/tickets/${number}`,
  approvalId: 2,
  createdAt: '2026-10-19T01:15:00Z',
})

// PR은 묶음(bundle)마다, 티켓은 패치가 없는 위치마다 하나 (BACKEND_API.md 7절)
export const deliveries: Delivery[] = [
  pr(1, 412), // eligibility
  pr(2, 413), // pricing
  pr(3, 414), // policy
  pr(4, 415), // batch
  pr(5, 416), // ui
  ticket(6, 1), // S6 P002 ELIGIBLE_MIN_AGE
  ticket(7, 2), // S15 P001 DSR_LIMIT
  ticket(8, 3), // S16 P002 DSR_LIMIT
  ticket(9, 4), // S21 ④ 고령자 설명 확인
]
