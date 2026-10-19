/** OFFICER: 준법감시 · 상품기획 담당자, DEVELOPER: 개발자 */
export type Role = 'OFFICER' | 'DEVELOPER'

export interface User {
  userId: number
  username: string // 로그인 아이디, 예: officer1
  displayName: string // 화면에 보이는 이름
  role: Role
}
