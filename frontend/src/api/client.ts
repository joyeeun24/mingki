import type { ApiErrorBody } from './types'

// 테스트 모드에서는 .env.development가 실리지 않으므로 기본값을 둔다
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
