/** 경계값, 시행일 전후, 시스템(신청 API 전체 흐름), 단위 */
export type TestKind = 'BOUNDARY' | 'EFFECTIVE_DATE' | 'SYSTEM' | 'UNIT'

/** test_agent가 요건에서 만든 테스트. 고정되어 design_agent가 고칠 수 없다 */
export interface TestCase {
  id: number
  testKey: string
  reqKey: string // 어느 요건의 테스트인지
  name: string
  kind: TestKind
  code: string
}
