<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import { ApiError } from '@/api/client'
import { getPatches, reviewPatches } from '@/api/tasks'
import DiffView from '@/components/domain/DiffView.vue'
import RoleNotice from '@/components/domain/RoleNotice.vue'
import VerifyBadge from '@/components/domain/VerifyBadge.vue'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useTaskContext } from '@/composables/taskContext'
import { useTaskResource } from '@/composables/useTaskResource'
import type { CodePatch } from '@/domain'
import { FAILURE_KIND_LABEL, TEST_KIND_LABEL, VERIFY_STATUS_LABEL } from '@/lib/labels'
import { notifyError } from '@/lib/notify'
import { useAuthStore } from '@/stores/auth'

const context = useTaskContext()
const auth = useAuthStore()
const router = useRouter()
const { data } = useTaskResource(getPatches)

const comment = ref('')
const submitting = ref(false)
const submitted = ref(false)

const taskId = computed(() => context.detail.value!.task.id)
const status = computed(() => context.detail.value!.task.status)

/** 파일마다 회차를 모은다. key는 백엔드의 현재 패치 기준과 같은 bundle::filePath */
const files = computed(() => {
  const groups = new Map<string, CodePatch[]>()
  for (const p of data.value?.patches ?? []) {
    const key = `${p.bundle}::${p.filePath}`
    groups.set(key, [...(groups.get(key) ?? []), p])
  }
  return [...groups].map(([key, rounds]) => {
    const sorted = rounds.sort((a, b) => a.round - b.round) // groups 안에서 만든 배열이라 바로 정렬
    return { key, rounds: sorted, latest: sorted.find((p) => p.latest) ?? sorted.at(-1)! }
  })
})
const bundles = computed(() => new Set(files.value.map((f) => f.latest.bundle)).size)

/** 승인할 수 없는 이유. 없으면 null */
const blocked = computed(() => {
  if (status.value === 'PUBLISHING' || status.value === 'DONE') return '검토 · 승인이 끝났습니다.'
  if (status.value !== 'WAITING_REVIEW') return '검증이 끝나면 승인할 수 있습니다.'
  if (auth.user?.role !== 'DEVELOPER') {
    return '검토 · 승인은 개발자만 할 수 있습니다. 개발자 계정으로 전환하세요.'
  }
  if (!data.value?.canApprove) return '검증을 통과하지 못한 패치가 있어 승인할 수 없습니다.'
  return null
})
const canApprove = computed(() => !blocked.value && !submitting.value && !submitted.value)

async function approve() {
  submitting.value = true
  try {
    await reviewPatches(taskId.value, {
      decision: 'APPROVE',
      comment: comment.value.trim() || undefined,
    })
    submitted.value = true
    toast.success('승인했습니다', { description: 'Draft PR과 작업 티켓을 만듭니다' })
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
  <div v-if="!data" class="space-y-4" aria-busy="true">
    <Skeleton class="h-24 w-full" />
    <Skeleton class="h-72 w-full" />
  </div>

  <div v-else class="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle> 검증 {{ data.latestRound }}/{{ data.maxVerifyRounds }}회차 결과 </CardTitle>
        <CardAction class="flex gap-2">
          <Badge>통과 {{ data.passed }}</Badge>
          <Badge :variant="data.failed > 0 ? 'destructive' : 'outline'"
            >실패 {{ data.failed }}</Badge
          >
          <Badge :variant="data.pending > 0 ? 'secondary' : 'outline'"
            >검증 중 {{ data.pending }}</Badge
          >
        </CardAction>
      </CardHeader>
    </Card>

    <p v-if="files.length === 0" class="text-muted-foreground text-sm">
      아직 수정안이 없습니다. 영향 위치 탐색이 끝나면 만들어집니다.
    </p>

    <Card v-for="file in files" :key="file.key" class="min-w-0">
      <CardHeader>
        <CardTitle class="font-mono text-sm">{{ file.latest.filePath }}</CardTitle>
        <CardAction class="flex items-center gap-2">
          <Badge variant="outline">{{ file.latest.bundle }}</Badge>
          <VerifyBadge :status="file.latest.verifyStatus" />
        </CardAction>
      </CardHeader>
      <CardContent class="min-w-0">
        <Tabs :default-value="String(file.latest.round)">
          <TabsList v-if="file.rounds.length > 1">
            <TabsTrigger v-for="p in file.rounds" :key="p.id" :value="String(p.round)">
              {{ p.round }}회차 · {{ VERIFY_STATUS_LABEL[p.verifyStatus] }}
            </TabsTrigger>
          </TabsList>
          <TabsContent
            v-for="p in file.rounds"
            :key="p.id"
            :value="String(p.round)"
            class="min-w-0 space-y-3"
          >
            <DiffView :diff="p.diff" />
            <div v-if="p.verifyLog" class="space-y-1">
              <p class="text-muted-foreground text-xs">
                검증 로그<template v-if="p.failureKind">
                  · {{ FAILURE_KIND_LABEL[p.failureKind] }}</template
                >
              </p>
              <pre
                class="bg-muted overflow-x-auto rounded-md p-3 font-mono text-xs whitespace-pre-wrap"
                >{{ p.verifyLog }}</pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>요건에서 만든 테스트 {{ data.testCases.length }}개</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple">
          <AccordionItem v-for="t in data.testCases" :key="t.testKey" :value="t.testKey">
            <AccordionTrigger>
              <span class="flex items-center gap-2 text-left">
                <Badge variant="outline">{{ t.reqKey }}</Badge>
                <Badge variant="secondary">{{ TEST_KIND_LABEL[t.kind] }}</Badge>
                {{ t.name }}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <pre class="bg-muted overflow-x-auto rounded-md p-3 font-mono text-xs">{{
                t.code
              }}</pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>

    <RoleNotice v-if="blocked" title="지금은 승인할 수 없습니다" :message="blocked" />

    <Field>
      <FieldLabel for="review-comment">코멘트 (선택)</FieldLabel>
      <Textarea id="review-comment" v-model="comment" :disabled="!canApprove" />
    </Field>

    <div class="flex justify-end">
      <AlertDialog>
        <AlertDialogTrigger as-child>
          <Button :disabled="!canApprove">
            <Spinner v-if="submitting" aria-hidden="true" />승인
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>승인할까요?</AlertDialogTitle>
            <AlertDialogDescription class="break-keep">
              검증을 통과한 수정안으로 Draft PR {{ bundles }}건과 작업 티켓을 만듭니다. 승인 기록은
              되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction @click="approve">승인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </div>
</template>
