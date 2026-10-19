import type { Requirement } from '@/domain'

/** 원문은 data/regulations/credit-loan-ops/v3.md · v4.md 그대로 */
export const requirements: Requirement[] = [
  {
    id: 1,
    reqKey: 'R1',
    summary: '고령자 기준 만 65세 → 만 60세',
    target: '개인신용대출 전 상품',
    effectiveDate: '2026-12-01',
    transitional: '시행일 전 신청분과 기존 계약의 기간 연장은 종전 기준(만 65세)',
    articleRef: '제15조',
    oldText: '이 기준에서 "고령자"란 신청일 현재 만 65세 이상인 자를 말한다.',
    newText: '이 기준에서 "고령자"란 신청일 현재 만 60세 이상인 자를 말한다.',
    status: 'CONFIRMED',
  },
  {
    id: 2,
    reqKey: 'R2',
    summary: 'DSR 한도 40% → 35%',
    target: '개인신용대출 전 상품',
    effectiveDate: '2026-12-01',
    transitional: '시행일 전 신청분과 기존 계약의 기간 연장은 종전 한도(40%)',
    articleRef: '제8조',
    oldText: '차주의 총부채원리금상환비율(DSR)은 40%를 초과할 수 없다.',
    newText: '차주의 총부채원리금상환비율(DSR)은 35%를 초과할 수 없다.',
    status: 'CONFIRMED',
  },
  {
    id: 3,
    reqKey: 'R3',
    summary: '고령자 대출 계약 전 설명 · 이해 확인 의무 신설',
    target: '고령자와 체결하는 대출 계약',
    effectiveDate: '2026-12-01',
    transitional: '시행일 이후 체결하는 계약부터 적용 (부칙 제3조)',
    articleRef: '제15조의2',
    oldText: null,
    newText: [
      '① 은행은 고령자와 대출 계약을 체결하기 전에 대출 금리, 상환 방식, 중도상환수수료 및 연체 시 불이익을 설명하고, 고령자가 이를 이해했는지 확인해야 한다.',
      '② 은행은 제1항에 따른 설명 일시, 설명 항목, 확인 방법 및 담당 직원을 기록하고, 계약 종료일부터 5년간 보관해야 한다.',
      '③ 제1항에 따른 확인을 마치지 않은 경우 대출 계약을 체결할 수 없다.',
    ].join('\n\n'),
    status: 'CONFIRMED',
  },
]
