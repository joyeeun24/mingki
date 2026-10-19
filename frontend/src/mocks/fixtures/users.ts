import type { User } from '@/domain'

/** 백엔드 시드 계정 (backend V2__seed.sql). 비밀번호는 모두 password */
export const users: User[] = [
  { userId: 1, username: 'officer1', displayName: '김준법', role: 'OFFICER' },
  { userId: 2, username: 'planner1', displayName: '박상품', role: 'OFFICER' },
  { userId: 3, username: 'dev1', displayName: '이개발', role: 'DEVELOPER' },
  { userId: 4, username: 'dev2', displayName: '최개발', role: 'DEVELOPER' },
]
