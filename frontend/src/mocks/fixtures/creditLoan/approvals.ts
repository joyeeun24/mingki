import type { Approval } from '@/domain'

export const approvals: Approval[] = [
  {
    id: 1,
    step: 'REQUIREMENTS',
    decision: 'CONFIRM',
    approverId: 1,
    comment: null,
    createdAt: '2026-10-19T01:03:00Z',
  },
  {
    id: 2,
    step: 'REVIEW',
    decision: 'APPROVE',
    approverId: 3,
    comment: '고령자 묶음 2회차 통과 확인',
    createdAt: '2026-10-19T01:14:00Z',
  },
]
