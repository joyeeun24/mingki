import type { User } from '@/domain'

import { request } from './client'
import type { LoginRequest, LoginResponse } from './types'

export function login(body: LoginRequest) {
  return request<LoginResponse>('/auth/login', { method: 'POST', json: body })
}

export function getMe() {
  return request<User>('/auth/me')
}
