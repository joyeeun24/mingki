import type { Evaluation } from '@/domain'

// PROJECT.md 10절: 키워드 검색은 780 · age > 64 · 경과조치를 놓치고, RETIREMENT_AGE · LTV_LIMIT를 잘못 고친다
export const evaluation: Evaluation = {
  locate: { recall: 1.0, precision: 1.0 },
  trapErrors: 0,
  verifyPassRate: { round1: 0.8, round2: 1.0 }, // 1회차 5묶음 중 4 통과
  keywordBaseline: {
    missed: ['S3', 'S2', 'S4'], // SENIOR_AGE_MONTHS = 780, age > 64, 경과조치 분기
    wrong: ['S7', 'S17'], // RETIREMENT_AGE = 65, LTV_LIMIT = 0.40
  },
  elapsedSec: 960,
}
