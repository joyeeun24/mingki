// 가짜 서버의 응답 부분. 요청 → 로그인 확인 → 검사 → 저장 → scenario 계산 결과를 백엔드 응답 모양으로.
// 검사 규칙과 오류 문구는 백엔드(TaskService, ApiExceptionHandler)와 같다.
// 상태 변화는 데모 화면에서 누를 수 있는 것(업로드 · 요건 확정 · 승인)만 흉내 낸다.
// 경로는 API_BASE(/api)에 고정한다. '*/api/*'처럼 넓게 잡으면 /src/api/*.ts 같은 소스 파일 요청까지 가로챈다.
import { delay, http, HttpResponse, type RequestHandler } from 'msw'

import { API_BASE } from '@/api/client'

import type {
  ApproveRequirementsRequest,
  LoginRequest,
  LoginResponse,
  ReviewRequest,
  TaskCreated,
} from '@/api/types'
import type { User } from '@/domain'

import { users } from './fixtures/users'
import { changeSpecsResponse, patchesResponse, requirementsResponse, taskDetail } from './responses'
import { type Snapshot, type TaskEvents, scenario } from './scenario'
import type { MockStore } from './store'

export interface MockOptions {
  store: MockStore
  now: () => number
  delayMs: number
}

const PASSWORD = 'password' // 백엔드 시드 계정과 같음
const MAX_FILE_BYTES = 1024 * 1024
const ALLOWED_EXT = ['md', 'markdown', 'txt']
const REQUIREMENT_STATUSES = ['PROPOSED', 'CONFIRMED', 'HELD'] // 백엔드 Requirement.Status
const APPROVAL_DECISIONS = ['CONFIRMED', 'HELD', 'APPROVE', 'REJECT', 'REQUEST_CHANGES'] // Approval.Decision

const STATUS_NAME: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  501: 'NOT_IMPLEMENTED',
}

/** 백엔드와 같은 {error, message}. msw는 던진 Response를 그대로 응답한다 */
function fail(status: number, message: string): never {
  throw HttpResponse.json({ error: STATUS_NAME[status], message }, { status })
}

const unreadable = () => fail(400, '요청 본문을 읽을 수 없습니다 (JSON 형식·enum 값 확인)')

export function tokenOf(user: User) {
  return `mock-${user.username}`
}

function userFrom(request: Request): User {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
  const user = users.find((u) => tokenOf(u) === token)
  if (!user) fail(401, '인증이 필요합니다')
  return user
}

async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    return unreadable()
  }
}

function expectStatus(snapshot: Snapshot, expected: Snapshot['task']['status']) {
  const actual = snapshot.task.status
  if (actual !== expected) fail(409, `작업 상태가 ${actual} 입니다 (필요: ${expected})`)
}

async function readRegulation(file: File, field: string): Promise<string> {
  if (file.size === 0) fail(400, `${field} 파일이 필요합니다`)
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''
  if (!ALLOWED_EXT.includes(ext)) fail(400, `${field} 는 .md / .txt 파일이어야 합니다`)
  const text = await file.text()
  if (text.trim() === '') fail(400, `${field} 내용이 비어 있습니다`)
  return text
}

export function createHandlers({ store, now, delayMs }: MockOptions): RequestHandler[] {
  /** 요청마다 시각을 한 번만 잰다. 검사와 응답이 같은 시각을 보게 */
  async function tick() {
    if (delayMs > 0) await delay(delayMs)
    return now()
  }

  function load(taskId: string, at: number): { events: TaskEvents; snapshot: Snapshot } {
    const events = store.get(taskId)
    if (!events) fail(404, 'task not found')
    return { events, snapshot: scenario(taskId, events, at) }
  }

  const taskPath = (rest = '') => `${API_BASE}/ai/tasks/:id${rest}`
  const idOf = (params: Record<string, unknown>) => String(params.id)

  return [
    // ---------- 인증 ----------
    http.post(`${API_BASE}/auth/login`, async ({ request }) => {
      await tick()
      const body = await readJson<Partial<LoginRequest>>(request)
      const user = users.find((u) => u.username === body.username)
      if (!user || body.password !== PASSWORD) fail(401, 'invalid credentials')
      return HttpResponse.json<LoginResponse>({ token: tokenOf(user), ...user })
    }),

    http.get(`${API_BASE}/auth/me`, async ({ request }) => {
      await tick()
      return HttpResponse.json<User>(userFrom(request))
    }),

    // ---------- 생성 ----------
    http.post(`${API_BASE}/ai/tasks`, async ({ request }) => {
      const at = await tick()
      const user = userFrom(request)
      const form = await request.formData().catch(() => fail(400, 'oldFile 파일이 필요합니다'))
      const oldFile = form.get('oldFile')
      const newFile = form.get('newFile')
      // 백엔드는 컨트롤러 전에 multipart 크기부터 막는다
      for (const file of [oldFile, newFile]) {
        if (file instanceof File && file.size > MAX_FILE_BYTES) {
          fail(413, '규정 파일은 1MB 이하여야 합니다')
        }
      }
      if (!(oldFile instanceof File)) fail(400, 'oldFile 파일이 필요합니다')
      if (!(newFile instanceof File)) fail(400, 'newFile 파일이 필요합니다')
      const oldText = await readRegulation(oldFile, 'oldFile')
      const newText = await readRegulation(newFile, 'newFile')
      if (oldText === newText) fail(400, '신·구 규정 파일 내용이 같습니다')

      const title = String(form.get('title') ?? '').trim()
      const taskId = crypto.randomUUID()
      store.put(taskId, {
        uploadedAt: at,
        requesterId: user.userId,
        title: title ? title.slice(0, 200) : '개인신용대출 운영기준 v3 → v4',
        filenames: { old: oldFile.name || 'regulation.md', new: newFile.name || 'regulation.md' },
        requirements: null,
        review: null,
      })
      return HttpResponse.json<TaskCreated>(
        { taskId, status: 'EXTRACTING' },
        { status: 202, headers: { Location: `/api/ai/tasks/${taskId}` } },
      )
    }),

    // ---------- 상세 ----------
    http.get(taskPath(), async ({ request, params }) => {
      const at = await tick()
      userFrom(request)
      return HttpResponse.json(taskDetail(load(idOf(params), at).snapshot))
    }),

    // ---------- ① 요건 확정 ----------
    http.get(taskPath('/requirements'), async ({ request, params }) => {
      const at = await tick()
      userFrom(request)
      return HttpResponse.json(requirementsResponse(load(idOf(params), at).snapshot))
    }),

    http.post(taskPath('/requirements/approval'), async ({ request, params }) => {
      const at = await tick()
      const user = userFrom(request)
      const body = await readJson<Partial<ApproveRequirementsRequest>>(request)
      const decisions = body.decisions ?? []
      // enum에 없는 값은 백엔드에서 JSON 읽기 단계에서 막힌다. 값이 없는(null) 경우는 아래 400
      if (decisions.some((d) => d.decision != null && !REQUIREMENT_STATUSES.includes(d.decision))) {
        unreadable()
      }
      if (user.role !== 'OFFICER') {
        fail(403, '요건 확정은 준법감시·상품기획 담당자만 할 수 있습니다')
      }
      const taskId = idOf(params)
      const { events, snapshot } = load(taskId, at)
      expectStatus(snapshot, 'WAITING_REQUIREMENT_APPROVAL')

      const byId = new Map<number, string | null>()
      for (const d of decisions) {
        if (d.decision !== 'CONFIRMED' && d.decision !== 'HELD') {
          fail(400, 'decision 은 CONFIRMED 또는 HELD 입니다')
        }
        byId.set(d.requirementId, d.decision)
      }
      const recorded: NonNullable<TaskEvents['requirements']>['decisions'] = {}
      for (const r of snapshot.requirements) {
        const decision = byId.get(r.id)
        if (decision !== 'CONFIRMED' && decision !== 'HELD') {
          fail(400, `요건 ${r.reqKey}(id ${r.id})에 대한 결정이 없습니다`)
        }
        recorded[r.id] = decision
        byId.delete(r.id)
      }
      if (byId.size > 0) fail(400, `이 작업에 없는 요건 id: [${[...byId.keys()].join(', ')}]`)

      const next: TaskEvents = {
        ...events,
        requirements: { at, by: user.userId, decisions: recorded, comment: body.comment ?? null },
      }
      store.put(taskId, next)
      return HttpResponse.json(scenario(taskId, next, at).approvals[0])
    }),

    // ---------- 영향 위치 ----------
    http.get(taskPath('/change-specs'), async ({ request, params }) => {
      const at = await tick()
      userFrom(request)
      return HttpResponse.json(changeSpecsResponse(load(idOf(params), at).snapshot))
    }),

    // ---------- ② 검토 · 승인 ----------
    http.get(taskPath('/patches'), async ({ request, params }) => {
      const at = await tick()
      userFrom(request)
      return HttpResponse.json(patchesResponse(load(idOf(params), at).snapshot))
    }),

    http.post(taskPath('/review'), async ({ request, params }) => {
      const at = await tick()
      const user = userFrom(request)
      const body = await readJson<Partial<ReviewRequest>>(request)
      if (body.decision != null && !APPROVAL_DECISIONS.includes(body.decision)) unreadable()
      if (user.role !== 'DEVELOPER') fail(403, '검토·승인은 개발자만 할 수 있습니다')
      if (!['APPROVE', 'REJECT', 'REQUEST_CHANGES'].includes(body.decision ?? '')) {
        fail(400, 'decision 은 APPROVE | REJECT | REQUEST_CHANGES 입니다')
      }
      const taskId = idOf(params)
      const { events, snapshot } = load(taskId, at)
      expectStatus(snapshot, 'WAITING_REVIEW')
      if (body.decision !== 'APPROVE') {
        fail(501, '가짜 서버는 승인(APPROVE)만 지원합니다. 거절 · 수정 요청은 데모 범위 밖입니다')
      }

      const excluded = body.excludedSpecKeys ?? []
      const targets = snapshot.patches
        .filter((p) => p.latest)
        .filter((p) => p.specKeys.length === 0 || !p.specKeys.every((k) => excluded.includes(k)))
      if (targets.length === 0) {
        fail(409, '승인할 패치가 없습니다. 전부 제외하려면 REJECT 를 쓰세요')
      }
      const notPassed = targets.filter((p) => p.verifyStatus !== 'PASSED')
      if (notPassed.length > 0) {
        const list = notPassed.map((p) => `${p.bundle}:${p.filePath}(${p.verifyStatus})`).join(', ')
        fail(
          409,
          `검증을 통과하지 못한 패치가 있어 승인할 수 없습니다: [${list}] — 해당 위치를 제외하거나 수정 요청하세요`,
        )
      }

      const next: TaskEvents = {
        ...events,
        review: { at, by: user.userId, comment: body.comment ?? null },
      }
      store.put(taskId, next)
      return HttpResponse.json(scenario(taskId, next, at).approvals[1])
    }),

    // ---------- 리포트 · 평가 (없으면 백엔드처럼 {}) ----------
    http.get(taskPath('/report'), async ({ request, params }) => {
      const at = await tick()
      userFrom(request)
      const { snapshot: s } = load(idOf(params), at)
      return HttpResponse.json({ task: s.task, report: s.report ?? {}, deliveries: s.deliveries })
    }),

    http.get(taskPath('/evaluation'), async ({ request, params }) => {
      const at = await tick()
      userFrom(request)
      const { snapshot: s } = load(idOf(params), at)
      return HttpResponse.json({ task: s.task, evaluation: s.evaluation ?? {} })
    }),

    // 목록 · 이벤트 등 흉내 내지 않는 주소. 개발 서버의 index.html로 새지 않게 막는다
    http.all(`${API_BASE}/*`, async () => {
      await tick()
      return fail(501, '가짜 서버가 지원하지 않는 요청입니다 (데모 범위 밖)')
    }),
  ]
}
