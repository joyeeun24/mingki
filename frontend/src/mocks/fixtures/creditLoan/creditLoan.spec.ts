// @vitest-environment node
import { describe, expect, it } from 'vitest'

import answerKey from '../../../../../eval/answer_key.md?raw'
import v3 from '../../../../../data/regulations/credit-loan-ops/v3.md?raw'
import v4 from '../../../../../data/regulations/credit-loan-ops/v4.md?raw'

import {
  changeSpecs,
  deliveries,
  documents,
  evaluation,
  patches,
  report,
  requirements,
  task,
  testCases,
} from '.'

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

describe('신용대출 v3 → v4 가짜 데이터', () => {
  it('요건 원문이 규정 파일과 같다', async () => {
    for (const r of requirements) {
      if (r.oldText !== null) expect(v3).toContain(r.oldText)
      if (r.newText !== null) expect(v4).toContain(r.newText)
      expect(v4).toContain(`### ${r.articleRef}(`)
    }
    expect(documents.map((d) => d.sha256)).toEqual([await sha256(v3), await sha256(v4)])
  })

  it('키가 겹치지 않고, 서로 가리키는 키가 모두 있다', () => {
    const reqKeys = requirements.map((r) => r.reqKey)
    const specKeys = changeSpecs.map((s) => s.specKey)
    expect(new Set(reqKeys).size).toBe(reqKeys.length)
    expect(new Set(specKeys).size).toBe(specKeys.length)
    expect(new Set(testCases.map((t) => t.testKey)).size).toBe(testCases.length)

    for (const s of changeSpecs) expect(reqKeys).toContain(s.reqKey)
    for (const t of testCases) expect(reqKeys).toContain(t.reqKey)
    const targetKeys = changeSpecs.filter((s) => s.target).map((s) => s.specKey)
    for (const p of patches) for (const k of p.specKeys) expect(targetKeys).toContain(k)
  })

  it('계획서 3절의 바꿀 곳과 대상 아님을 모두 담는다', () => {
    const expected: [reqKey: string, snippet: string, target: boolean][] = [
      ['R1', 'age >= 65', true],
      ['R1', 'age > 64', true],
      ['R1', 'SENIOR_AGE_MONTHS = 780', true],
      ['R1', 'ELIGIBLE_MIN_AGE', true],
      ['R1', 'RETIREMENT_AGE = 65', false],
      ['R1', 'SENIOR_RATE_DISCOUNT', false],
      ['R2', 'DSR_LIMIT: 0.40', true],
      ['R2', '> 0.4:', true],
      ['R2', 'DSR 40%', true],
      ['R2', 'LTV_LIMIT = 0.40', false],
      ['R2', 'R015 · DSR_LIMIT = 0.35', false],
    ]
    for (const [reqKey, snippet, target] of expected) {
      const found = changeSpecs.filter((s) => s.reqKey === reqKey && s.snippet?.includes(snippet))
      expect(found.length, snippet).toBeGreaterThan(0)
      for (const s of found) expect(s.target, snippet).toBe(target)
    }
    // 경과조치 분기와 ④ 신규는 아직 없는 코드라 줄 번호가 없다
    const transitional = changeSpecs.find((s) => s.reqKey === 'R1' && s.reason.includes('경과조치'))
    expect(transitional).toMatchObject({ target: true, lineNo: null })
    expect(changeSpecs.find((s) => s.reqKey === 'R3')).toMatchObject({ changeType: 'NEW' })
  })

  it('상품 규칙 판단이 정답지와 같다', () => {
    const answers = new Map<string, boolean>()
    for (const line of answerKey.split('\n')) {
      const cells = line.split('|').map((c) => c.trim())
      if (!/^R\d{3}/.test(cells[1] ?? '')) continue
      for (const id of cells[1]!.split(',').map((s) => s.trim())) {
        answers.set(id, cells[6]!.includes('변경 대상'))
      }
    }
    const ours = new Map<string, boolean>()
    for (const s of changeSpecs) {
      const id = s.snippet?.match(/R\d{3}/)?.[0]
      if (s.locationKind === 'PRODUCT' && id) ours.set(id, s.target)
    }
    for (const [id, target] of ours) expect(answers.get(id), id).toBe(target)
    for (const [id, target] of answers) if (target) expect(ours.get(id), id).toBe(true)
  })

  it('고령자 묶음은 1회차 실패 후 2회차 통과, 나머지는 1회차 통과', () => {
    const latest = patches.filter((p) => p.latest)
    const files = latest.map((p) => `${p.bundle}:${p.filePath}`)
    expect(new Set(files).size).toBe(files.length)
    expect(latest.every((p) => p.verifyStatus === 'PASSED')).toBe(true)

    const eligibility = patches.filter((p) => p.bundle === 'eligibility')
    expect(eligibility.map((p) => [p.round, p.verifyStatus, p.failureKind])).toEqual([
      [1, 'FAILED', 'PATCH'],
      [2, 'PASSED', null],
    ])
    expect(task.verifyRound).toBe(Math.max(...patches.map((p) => p.round)))

    // 패치가 있는 대상 위치는 모두 현재 회차 패치에 들어 있다
    const patched = new Set(latest.flatMap((p) => p.specKeys))
    for (const s of changeSpecs)
      if (s.target && s.bundle) expect(patched, s.specKey).toContain(s.specKey)
  })

  it('PR은 묶음마다 하나', () => {
    const bundles = new Set(patches.map((p) => p.bundle))
    expect(deliveries.filter((d) => d.kind === 'PR')).toHaveLength(bundles.size)
  })

  it('평가의 놓친 곳은 대상, 잘못 고친 곳은 대상 아님이고, 명세서는 요건마다 있다', () => {
    const byKey = new Map(changeSpecs.map((s) => [s.specKey, s]))
    for (const k of evaluation.keywordBaseline.missed) expect(byKey.get(k)?.target, k).toBe(true)
    for (const k of evaluation.keywordBaseline.wrong) expect(byKey.get(k)?.target, k).toBe(false)
    for (const r of requirements) expect(report.markdown).toContain(`## ${r.reqKey}.`)
  })
})
