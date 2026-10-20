import type { Approval } from '@/domain'

import { users } from '../users'

const [officer1, , dev1] = users

export const approvals: Approval[] = [
  {
    id: 1,
    step: 'REQUIREMENTS',
    decision: 'CONFIRMED',
    approverId: officer1!.userId,
    approver: officer1!,
    comment: null,
    createdAt: '2026-10-19T01:03:00Z',
  },
  {
    id: 2,
    step: 'REVIEW',
    decision: 'APPROVE',
    approverId: dev1!.userId,
    approver: dev1!,
    comment: '고령자 묶음 2회차 통과 확인',
    createdAt: '2026-10-19T01:14:00Z',
  },
]
