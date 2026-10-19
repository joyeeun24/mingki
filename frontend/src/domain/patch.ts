/** PENDING: 검증 전, PASSED: 통과, FAILED: 실패 */
export type VerifyStatus = 'PENDING' | 'PASSED' | 'FAILED'

/** PATCH: 패치 적용 · 문법 · 테스트 실패(design으로), SYSTEM_TEST: 시스템 테스트 실패(locate로) */
export type FailureKind = 'PATCH' | 'SYSTEM_TEST'

/** design_agent가 파일 하나에 만든 패치. 검증 회차마다 새로 쌓인다 */
export interface CodePatch {
  id: number
  bundle: string // 같이 고치는 파일 묶음
  round: number // 몇 번째 검증인지
  specKeys: string[] // 이 패치가 고치는 위치
  filePath: string
  diff: string
  verifyStatus: VerifyStatus
  verifyLog: string | null // 검증 로그, 실패 이유
  failureKind: FailureKind | null
  latest: boolean // 지금 회차의 패치인지
}
