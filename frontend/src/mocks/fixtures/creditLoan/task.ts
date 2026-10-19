import type { AnalysisTask, RegulationDocument } from '@/domain'

export const task: AnalysisTask = {
  id: '6f2c8a1e-3b7d-4c59-9a0e-2d1f5b8c7e40',
  title: '개인신용대출 운영기준 v3 → v4',
  status: 'DONE',
  currentNode: 'report',
  verifyRound: 2,
  requesterId: 1,
  createdAt: '2026-10-19T01:00:00Z',
  updatedAt: '2026-10-19T01:16:00Z',
}

/** data/regulations/credit-loan-ops/ 파일. sha256은 파일 내용 기준 */
export const documents: RegulationDocument[] = [
  {
    side: 'OLD',
    versionLabel: 'v3',
    filename: 'v3.md',
    sha256: '1b72034719a1aa791aea805de5470061756360ac091390680bb732cae1355ae3',
  },
  {
    side: 'NEW',
    versionLabel: 'v4',
    filename: 'v4.md',
    sha256: 'd860b630914ae88fea719f212b9344cc230ff55b29e642dc561be2788cd90c13',
  },
]
