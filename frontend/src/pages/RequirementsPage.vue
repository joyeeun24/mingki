<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import { ApiError } from '@/api/client'
import { approveRequirements, getRequirements } from '@/api/tasks'
import RoleNotice from '@/components/domain/RoleNotice.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useTaskContext } from '@/composables/taskContext'
import { useTaskResource } from '@/composables/useTaskResource'
import type { Requirement, RequirementDecision } from '@/domain'
import { formatDate } from '@/lib/format'
import { REQUIREMENT_STATUS_LABEL } from '@/lib/labels'
import { notifyError } from '@/lib/notify'
import { useAuthStore } from '@/stores/auth'

const context = useTaskContext()
const auth = useAuthStore()
const router = useRouter()
const { data } = useTaskResource(getRequirements)

// 다시 불러와도 고른 값은 그대로 둔다. 기본 선택은 없다 (감사 기록에 남는 결정이라 직접 고르게)
const decisions = reactive<Record<number, RequirementDecision | undefined>>({})
const comment = ref('')
const submitting = ref(false)
const submitted = ref(false)

const taskId = computed(() => context.detail.value!.task.id)
const status = computed(() => context.detail.value!.task.status)
const requirements = computed(() => data.value?.requirements ?? [])
const versions = computed(() => {
  const docs = data.value?.documents ?? []
  return {
    old: docs.find((d) => d.side === 'OLD')?.versionLabel ?? '이전',
    new: docs.find((d) => d.side === 'NEW')?.versionLabel ?? '신규',
  }
})

/** 확정할 수 없는 이유. 없으면 null */
const blocked = computed(() => {
  if (status.value === 'EXTRACTING') return '요건을 추출하고 있습니다. 잠시 기다려 주세요.'
  if (status.value !== 'WAITING_REQUIREMENT_APPROVAL') return '요건 확정이 끝났습니다.'
  if (auth.user?.role !== 'OFFICER') {
    return '요건 확정은 담당자(준법감시 · 상품기획)만 할 수 있습니다. 담당자 계정으로 전환하세요.'
  }
  return null
})
const editable = computed(() => !blocked.value && !submitted.value)

/** 확정 뒤에는 서버에 기록된 결정을 보여준다 */
function shown(r: Requirement): RequirementDecision | undefined {
  return decisions[r.id] ?? (r.status === 'PROPOSED' ? undefined : r.status)
}

const decided = computed(() => requirements.value.filter((r) => decisions[r.id]).length)
const canSubmit = computed(
  () =>
    editable.value &&
    !submitting.value &&
    requirements.value.length > 0 &&
    decided.value === requirements.value.length,
)

function confirmAll() {
  for (const r of requirements.value) decisions[r.id] = 'CONFIRMED'
}

async function submit() {
  submitting.value = true
  try {
    await approveRequirements(taskId.value, {
      decisions: requirements.value.map((r) => ({
        requirementId: r.id,
        decision: decisions[r.id]!,
      })),
      comment: comment.value.trim() || undefined,
    })
    submitted.value = true
    toast.success('요건을 확정했습니다', { description: '영향 위치 탐색을 시작합니다' })
    await context.refresh()
    await router.push({ name: 'task-progress', params: { id: taskId.value } })
  } catch (error) {
    notifyError(error)
    if (error instanceof ApiError && error.status === 409) await context.refresh()
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <RoleNotice v-if="blocked" title="지금은 확정할 수 없습니다" :message="blocked" />

    <div v-if="!data" class="space-y-4" aria-busy="true">
      <Skeleton class="h-48 w-full" />
      <Skeleton class="h-48 w-full" />
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center gap-3">
        <p class="text-sm">
          요건 <strong>{{ requirements.length }}</strong
          >건 중 <strong>{{ decided }}</strong
          >건 결정
        </p>
        <Button
          variant="outline"
          size="sm"
          class="ml-auto"
          :disabled="!editable"
          @click="confirmAll"
        >
          모두 확정
        </Button>
      </div>

      <Card v-for="r in requirements" :key="r.id">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Badge variant="outline">{{ r.reqKey }}</Badge>
            {{ r.summary }}
          </CardTitle>
          <CardDescription>근거 조항: {{ r.articleRef ?? '미정' }}</CardDescription>
          <CardAction>
            <Badge :variant="r.status === 'HELD' ? 'outline' : 'secondary'">
              {{ REQUIREMENT_STATUS_LABEL[r.status] }}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent class="space-y-4">
          <dl class="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt class="text-muted-foreground text-xs">적용 대상</dt>
              <dd class="break-keep">{{ r.target ?? '미정' }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground text-xs">시행일</dt>
              <dd>{{ formatDate(r.effectiveDate) }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground text-xs">경과조치</dt>
              <dd class="break-keep">{{ r.transitional ?? '없음' }}</dd>
            </div>
          </dl>
          <div class="grid gap-3 md:grid-cols-2">
            <div class="bg-muted rounded-md p-3 text-sm">
              <p class="text-muted-foreground mb-1 text-xs">
                바뀌기 전 ({{ versions.old }} {{ r.articleRef }})
              </p>
              <p v-if="r.oldText" class="break-keep whitespace-pre-line">{{ r.oldText }}</p>
              <p v-else class="text-muted-foreground">신설 조항 (이전 규정에 없음)</p>
            </div>
            <div class="rounded-md border border-sky-300 bg-sky-50 p-3 text-sm dark:bg-sky-950">
              <p class="text-muted-foreground mb-1 text-xs">
                바뀐 후 ({{ versions.new }} {{ r.articleRef }})
              </p>
              <p v-if="r.newText" class="break-keep whitespace-pre-line">{{ r.newText }}</p>
              <p v-else class="text-muted-foreground">삭제된 조항</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <RadioGroup
            :model-value="shown(r)"
            orientation="horizontal"
            class="flex gap-6"
            :disabled="!editable"
            :aria-label="`${r.reqKey} 결정`"
            @update:model-value="decisions[r.id] = $event as RequirementDecision"
          >
            <div class="flex items-center gap-2">
              <RadioGroupItem :id="`req-${r.id}-confirmed`" value="CONFIRMED" />
              <Label :for="`req-${r.id}-confirmed`">확정</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem :id="`req-${r.id}-held`" value="HELD" />
              <Label :for="`req-${r.id}-held`">보류</Label>
            </div>
          </RadioGroup>
        </CardFooter>
      </Card>

      <Field>
        <FieldLabel for="requirements-comment">코멘트 (선택)</FieldLabel>
        <Textarea
          id="requirements-comment"
          v-model="comment"
          :disabled="!editable"
          placeholder="보류 이유 등을 남기면 결정 기록에 함께 저장됩니다"
        />
      </Field>

      <div class="flex justify-end">
        <Button :disabled="!canSubmit" @click="submit">
          <Spinner v-if="submitting" aria-hidden="true" />결정 제출
        </Button>
      </div>
    </template>
  </div>
</template>
