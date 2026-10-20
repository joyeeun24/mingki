import type { ApiErrorBody } from './types'

// 개발 · 운영은 .env.*의 /api, 테스트는 vite.config.ts test.env의 절대 주소
const base = import.meta.env.VITE_API_BASE || '/api'

let token: string | null = null

export function setToken(value: string | null) {
  token = value
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
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.json !== undefined) headers.set('Content-Type', 'application/json')

  // msw/node가 상대 URL을 가로채려면 Request 객체가 아니라 문자열로 넘겨야 한다
  const response = await fetch(`${base}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.form,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null
    throw new ApiError(
      response.status,
      body?.error ?? 'UNKNOWN',
      body?.message ?? response.statusText,
    )
  }
  return (await response.json()) as T
}
