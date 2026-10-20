import { request } from './client'
import type {
  ApproveRequirementsRequest,
  ChangeSpecsResponse,
  CreateTaskRequest,
  EvaluationResponse,
  PatchesResponse,
  ReportResponse,
  RequirementsResponse,
  ReviewRequest,
  TaskCreated,
  TaskDetail,
} from './types'
import type { Approval, Evaluation, Report } from '@/domain'

const tasks = '/ai/tasks'

export function createTask({ oldFile, newFile, title }: CreateTaskRequest) {
  const form = new FormData()
  form.set('oldFile', oldFile)
  form.set('newFile', newFile)
  if (title) form.set('title', title)
  return request<TaskCreated>(tasks, { method: 'POST', form })
}

export function getTask(id: string) {
  return request<TaskDetail>(`${tasks}/${id}`)
}

export function getRequirements(id: string) {
  return request<RequirementsResponse>(`${tasks}/${id}/requirements`)
}

export function approveRequirements(id: string, body: ApproveRequirementsRequest) {
  return request<Approval>(`${tasks}/${id}/requirements/approval`, { method: 'POST', json: body })
}

export function getChangeSpecs(id: string) {
  return request<ChangeSpecsResponse>(`${tasks}/${id}/change-specs`)
}

export function getPatches(id: string) {
  return request<PatchesResponse>(`${tasks}/${id}/patches`)
}

export function reviewPatches(id: string, body: ReviewRequest) {
  return request<Approval>(`${tasks}/${id}/review`, { method: 'POST', json: body })
}

// 백엔드는 리포트 · 평가가 아직 없으면 null이 아니라 {}를 보낸다
type Empty = Record<string, never>

function orNull<T extends object>(value: T | Empty | null): T | null {
  return value === null || Object.keys(value).length === 0 ? null : (value as T)
}

export async function getReport(id: string): Promise<ReportResponse> {
  const raw = await request<Omit<ReportResponse, 'report'> & { report: Report | Empty }>(
    `${tasks}/${id}/report`,
  )
  return { ...raw, report: orNull(raw.report) }
}

export async function getEvaluation(id: string): Promise<EvaluationResponse> {
  const raw = await request<
    Omit<EvaluationResponse, 'evaluation'> & { evaluation: Evaluation | Empty }
  >(`${tasks}/${id}/evaluation`)
  return { ...raw, evaluation: orNull(raw.evaluation) }
}
