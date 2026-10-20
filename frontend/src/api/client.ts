import type { ApiErrorBody } from './types'

/** 개발 · 운영은 .env.*의 /api, 테스트는 vite.config.ts test.env의 절대 주소. 가짜 서버도 이 값을 쓴다 */
export const API_BASE = import.meta.env.VITE_API_BASE || '/api'

let token: string | null = null
let onUnauthorized: (() => void) | null = null

export function setToken(value: string | null) {
  token = value
}

/** 토큰을 실어 보낸 요청이 401을 받으면 부른다 (로그인 실패 401은 해당 없음). main.ts에서 등록 */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

export class ApiError extends Error {
  readonly status: number
  readonly error: string // 예: CONFLICT

  constructor(status: number, error: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.error = error
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  json?: unknown
  form?: FormData
}

/** 서버 호출은 전부 이 함수를 거친다. 비2xx는 ApiError로 던진다 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers()
  const sentToken = token !== null
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.json !== undefined) headers.set('Content-Type', 'application/json')

  // msw/node가 상대 URL을 가로채려면 Request 객체가 아니라 문자열로 넘겨야 한다
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.form,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null
    if (response.status === 401 && sentToken) onUnauthorized?.()
    throw new ApiError(
      response.status,
      body?.error ?? 'UNKNOWN',
      body?.message ?? response.statusText,
    )
  }
  return (await response.json()) as T
}
