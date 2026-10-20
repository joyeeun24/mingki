<script setup lang="ts">
import {
  CheckIcon,
  CircleDotIcon,
  CircleIcon,
  CircleXIcon,
  PartyPopperIcon,
  TriangleAlertIcon,
  UserRoundIcon,
} from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useTaskContext } from '@/composables/taskContext'
import type { TaskStatus } from '@/domain'
import { formatDateTime } from '@/lib/format'
import { APPROVAL_STEP_LABEL, DECISION_LABEL, ROLE_LABEL, TASK_STATUS_LABEL } from '@/lib/labels'
import { TERMINAL_STATUSES, WAITING_STATUSES } from '@/lib/status'
import { useAuthStore } from '@/stores/auth'

const { detail } = useTaskContext()
const auth = useAuthStore()

const STEPS: { label: string; status: TaskStatus }[] = [
  { label: '요건 추출', status: 'EXTRACTING' },
  { label: '요건 확정', status: 'WAITING_REQUIREMENT_APPROVAL' },
  { label: '영향 위치 탐색 · 테스트 생성', status: 'LOCATING' },
  { label: '수정안 생성', status: 'DESIGNING' },
  { label: '검증', status: 'VERIFYING' },
  { label: '검토 · 승인', status: 'WAITING_REVIEW' },
  { label: 'PR · 티켓 생성', status: 'PUBLISHING' },
  { label: '완료', status: 'DONE' },
]
// 성공 흐름 밖에서 끝난 상태는 멈춘 단계에 표시한다
const STOPPED_AT: Partial<Record<TaskStatus, number>> = {
  NO_CHANGE: 0,
  HELD: 1,
  REJECTED: 5,
}

const task = computed(() => detail.value!.task)
const pending = computed(() => detail.value!.pendingAction)
const myTurn = computed(() => pending.value !== null && pending.value.role === auth.user?.role)

const current = computed(() => {
  const status = task.value.status
  const index = STEPS.findIndex((s) => s.status === status)
  return index >= 0 ? index : (STOPPED_AT[status] ?? 0)
})

type StepState = 'done' | 'running' | 'waiting' | 'stopped' | 'todo'

function stateOf(index: number): StepState {
  const status = task.value.status
  if (index < current.value) return 'done'
  if (index > current.value) return 'todo'
  if (status === 'DONE') return 'done'
  if (TERMINAL_STATUSES.has(status)) return 'stopped'
  return WAITING_STATUSES.has(status) ? 'waiting' : 'running'
}

function labelOf(index: number): string {
  const { status, verifyRound } = task.value
  const step = STEPS[index]!
  if (step.status === 'DESIGNING' && status === 'DESIGNING' && verifyRound >= 1) {
    return `수정안 다시 생성 (${verifyRound}회차 검증 실패)`
  }
  if (step.status === 'VERIFYING' && verifyRound >= 1) {
    return `검증 ${verifyRound}/${detail.value!.maxVerifyRounds}회차`
  }
  return step.label
}

const actionRoute = computed(() =>
  pending.value?.step === 'REVIEW' ? 'task-review' : 'task-requirements',
)
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[1fr_20rem]">
    <div class="min-w-0 space-y-4">
      <p role="status" class="text-sm">
        지금 상태: <strong>{{ TASK_STATUS_LABEL[task.status] }}</strong>
      </p>

      <Alert v-if="pending">
        <UserRoundIcon />
        <AlertTitle>
          {{
            pending.step === 'REQUIREMENTS' ? '요건 확정이 필요합니다' : '검토 · 승인이 필요합니다'
          }}
        </AlertTitle>
        <AlertDescription class="break-keep">
          <template v-if="myTurn">
            {{ ROLE_LABEL[pending.role] }}가 확인할 차례입니다.
            <Button as-child size="sm" class="mt-2">
              <RouterLink :to="{ name: actionRoute, params: { id: task.id } }">
                {{ pending.step === 'REQUIREMENTS' ? '요건 확정하러 가기' : '검토하러 가기' }}
              </RouterLink>
            </Button>
          </template>
          <template v-else>
            {{ ROLE_LABEL[pending.role] }} 계정으로 확인해야 합니다. 오른쪽 위 '계정 전환'을
            누르세요.
          </template>
        </AlertDescription>
      </Alert>

      <Alert v-else-if="task.status === 'DONE'">
        <PartyPopperIcon />
        <AlertTitle>완료되었습니다</AlertTitle>
        <AlertDescription>
          <div class="mt-1 flex gap-2">
            <Button as-child size="sm">
              <RouterLink :to="{ name: 'task-report', params: { id: task.id } }">
                리포트 보기
              </RouterLink>
            </Button>
            <Button as-child size="sm" variant="outline">
              <RouterLink :to="{ name: 'task-evaluation', params: { id: task.id } }">
                키워드 검색과 비교
              </RouterLink>
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <Alert v-else-if="task.status === 'FAILED'" variant="destructive">
        <TriangleAlertIcon />
        <AlertTitle>시스템 오류로 멈췄습니다</AlertTitle>
        <AlertDescription>{{ detail!.errorMessage ?? '원인을 알 수 없습니다' }}</AlertDescription>
      </Alert>

      <Alert v-else-if="TERMINAL_STATUSES.has(task.status)">
        <CircleXIcon />
        <AlertTitle>{{ TASK_STATUS_LABEL[task.status] }}</AlertTitle>
        <AlertDescription class="break-keep">
          더 진행할 일이 없습니다. 결정 기록에서 이유를 확인하세요.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader><CardTitle>진행 단계</CardTitle></CardHeader>
        <CardContent>
          <ol class="space-y-3">
            <li
              v-for="(step, index) in STEPS"
              :key="step.status"
              class="flex items-center gap-3"
              :aria-current="index === current ? 'step' : undefined"
              :data-state="stateOf(index)"
            >
              <span class="flex size-7 shrink-0 items-center justify-center rounded-full border">
                <CheckIcon v-if="stateOf(index) === 'done'" class="size-4" aria-hidden="true" />
                <Spinner v-else-if="stateOf(index) === 'running'" aria-hidden="true" />
                <CircleDotIcon
                  v-else-if="stateOf(index) === 'waiting'"
                  class="size-4 text-amber-600"
                  aria-hidden="true"
                />
                <CircleXIcon
                  v-else-if="stateOf(index) === 'stopped'"
                  class="text-destructive size-4"
                  aria-hidden="true"
                />
                <CircleIcon v-else class="text-muted-foreground size-3" aria-hidden="true" />
              </span>
              <span
                :class="{
                  'font-semibold': index === current,
                  'text-muted-foreground': stateOf(index) === 'todo',
                }"
              >
                {{ labelOf(index) }}
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>

    <div class="space-y-4">
      <Card>
        <CardHeader><CardTitle>올린 규정</CardTitle></CardHeader>
        <CardContent class="space-y-1 text-sm">
          <p v-for="doc in detail!.documents" :key="doc.side">
            <Badge variant="outline">{{ doc.versionLabel }}</Badge>
            {{ doc.filename }}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>결정 기록</CardTitle></CardHeader>
        <CardContent class="space-y-3 text-sm">
          <p v-if="detail!.approvals.length === 0" class="text-muted-foreground">
            아직 결정 기록이 없습니다
          </p>
          <div v-for="approval in detail!.approvals" :key="approval.id" class="space-y-1">
            <p>
              <strong>{{ APPROVAL_STEP_LABEL[approval.step] }}</strong> ·
              {{ DECISION_LABEL[approval.decision] }}
            </p>
            <p class="text-muted-foreground text-xs">
              {{ approval.approver.displayName }}({{ ROLE_LABEL[approval.approver.role] }}) ·
              {{ formatDateTime(approval.createdAt) }}
            </p>
            <p v-if="approval.comment" class="text-xs break-keep">“{{ approval.comment }}”</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
