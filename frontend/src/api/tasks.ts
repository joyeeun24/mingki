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
import type { Approval } from '@/domain'

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

export function getReport(id: string) {
  return request<ReportResponse>(`${tasks}/${id}/report`)
}

export function getEvaluation(id: string) {
  return request<EvaluationResponse>(`${tasks}/${id}/evaluation`)
}
