<script setup lang="ts">
import { ChartColumnIcon } from '@lucide/vue'
import { computed } from 'vue'

import { getChangeSpecs, getEvaluation } from '@/api/tasks'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTaskResource } from '@/composables/useTaskResource'
import type { ChangeSpec } from '@/domain'
import { formatDuration, formatPercent } from '@/lib/format'

const evaluationResource = useTaskResource(getEvaluation)
const specsResource = useTaskResource(getChangeSpecs)

const loading = computed(() => !evaluationResource.data.value || !specsResource.data.value)
const evaluation = computed(() => evaluationResource.data.value?.evaluation ?? null)

/** 키워드 검색이 틀린 곳을 영향 위치와 이어 붙인다 */
const comparison = computed(() => {
  const specs = specsResource.data.value
  const baseline = evaluation.value?.keywordBaseline
  if (!specs || !baseline) return []
  const byKey = new Map<string, ChangeSpec>(
    [...specs.targets, ...specs.nonTargets].map((s) => [s.specKey, s]),
  )
  const row = (key: string, keyword: 'missed' | 'wrong') => ({ key, keyword, spec: byKey.get(key) })
  return [
    ...baseline.missed.map((k) => row(k, 'missed')),
    ...baseline.wrong.map((k) => row(k, 'wrong')),
  ]
})
</script>

<template>
  <Skeleton v-if="loading" class="h-96 w-full" aria-busy="true" />

  <Empty v-else-if="!evaluation" class="border">
    <EmptyHeader>
      <EmptyMedia variant="icon"><ChartColumnIcon /></EmptyMedia>
      <EmptyTitle>아직 비교 결과가 없습니다</EmptyTitle>
      <EmptyDescription class="break-keep">
        작업이 끝나면 정답지 기준 점수와 키워드 검색 비교가 나옵니다.
      </EmptyDescription>
    </EmptyHeader>
  </Empty>

  <div v-else class="space-y-4">
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardDescription>고칠 곳 찾기</CardDescription>
          <CardTitle class="text-2xl">{{ formatPercent(evaluation.locate.recall) }}</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2 text-xs">
          <Progress :model-value="evaluation.locate.recall * 100" aria-label="찾은 비율" />
          <p class="text-muted-foreground">
            정확도 {{ formatPercent(evaluation.locate.precision) }}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>함정을 잘못 고친 수</CardDescription>
          <CardTitle class="text-2xl">{{ evaluation.trapErrors }}건</CardTitle>
        </CardHeader>
        <CardContent class="text-muted-foreground text-xs break-keep">
          같은 숫자라도 다른 의미면 고치지 않습니다
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>검증 통과율</CardDescription>
          <CardTitle class="text-2xl">
            {{ formatPercent(evaluation.verifyPassRate.round2) }}
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-2 text-xs">
          <p class="text-muted-foreground">
            1회차 {{ formatPercent(evaluation.verifyPassRate.round1) }}
          </p>
          <Progress
            :model-value="evaluation.verifyPassRate.round1 * 100"
            aria-label="1회차 통과율"
          />
          <p class="text-muted-foreground">
            2회차 {{ formatPercent(evaluation.verifyPassRate.round2) }}
          </p>
          <Progress
            :model-value="evaluation.verifyPassRate.round2 * 100"
            aria-label="2회차 통과율"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>걸린 시간</CardDescription>
          <CardTitle class="text-2xl">{{ formatDuration(evaluation.elapsedSec) }}</CardTitle>
        </CardHeader>
        <CardContent class="text-muted-foreground text-xs">업로드부터 Draft PR까지</CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>키워드 검색과 비교</CardTitle>
        <CardDescription class="break-keep">
          "65", "0.4" 같은 숫자로 검색하면 놓치거나 잘못 고치는 곳입니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>위치</TableHead>
              <TableHead>이유</TableHead>
              <TableHead class="w-28">키워드 검색</TableHead>
              <TableHead class="w-28">Rule Ripple</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="row in comparison" :key="row.key" class="align-top">
              <TableCell>
                <code class="font-mono text-xs whitespace-pre-wrap break-all">
                  {{ row.spec?.snippet ?? row.spec?.filePath ?? row.key }}
                </code>
              </TableCell>
              <TableCell class="max-w-96 whitespace-normal break-keep">
                {{ row.spec?.reason }}
              </TableCell>
              <TableCell>
                <Badge variant="destructive">
                  {{ row.keyword === 'missed' ? '놓침' : '잘못 고침' }}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge>{{ row.keyword === 'missed' ? '찾음' : '대상 아님으로 판단' }}</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
