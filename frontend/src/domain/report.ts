/** report 노드 결과. 변경 명세서 */
export interface Report {
  markdown: string
  summary: string
}

/** 평가 스크립트 결과 (BACKEND_API.md 6절 PUT /evaluation). keywordBaseline 모양은 프론트 제안 */
export interface Evaluation {
  locate: { recall: number; precision: number }
  trapErrors: number // 함정을 잘못 고친 수
  verifyPassRate: { round1: number; round2: number }
  keywordBaseline: {
    missed: string[] // 키워드 검색이 놓친 위치의 specKey
    wrong: string[] // 키워드 검색이 잘못 고친 위치의 specKey
  }
  elapsedSec: number // 업로드부터 Draft PR까지
}
