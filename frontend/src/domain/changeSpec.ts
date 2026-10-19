/** VALUE: ① 값, LOGIC: ② 로직, DB: ③ DB, NEW: ④ 신규 */
export type ChangeType = 'VALUE' | 'LOGIC' | 'DB' | 'NEW'

/** 코드, 설정 파일, DB 스키마, 상품 규칙, 문서, 화면 문구 */
export type LocationKind = 'CODE' | 'CONFIG' | 'DB' | 'PRODUCT' | 'DOC' | 'UI'

interface ChangeSpecBase {
  id: number
  specKey: string // 예: S3. 패치가 이 키로 위치를 가리킨다
  reqKey: string // 어느 요건 때문인지
  locationKind: LocationKind
  filePath: string | null
  symbol: string | null // 함수 · 상수 이름
  lineNo: number | null // 경과조치 분기처럼 아직 없는 로직이면 null
  snippet: string | null // 지금 코드
  reason: string // 판단 이유
  bundle: string | null // 같이 고치는 파일 묶음
}

/** locate_agent가 찾은 위치. 대상이 아닌 곳도 이유와 함께 남긴다 */
export type ChangeSpec =
  | (ChangeSpecBase & { target: true; changeType: ChangeType })
  | (ChangeSpecBase & { target: false; changeType: null })
