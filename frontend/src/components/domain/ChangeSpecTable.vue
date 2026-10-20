<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ChangeSpec } from '@/domain'
import { CHANGE_TYPE_LABEL, LOCATION_KIND_LABEL } from '@/lib/labels'

// 바꿀 곳과 대상 아님이 같은 표를 쓰고, 바꿀 곳에만 변경 종류 열이 있다
defineProps<{ specs: ChangeSpec[]; showChangeType: boolean }>()

function place(spec: ChangeSpec): string {
  if (!spec.filePath) return spec.symbol ?? '-'
  return spec.lineNo ? `${spec.filePath}:${spec.lineNo}` : spec.filePath
}
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead class="w-16">요건</TableHead>
        <TableHead class="w-24">종류</TableHead>
        <TableHead>위치</TableHead>
        <TableHead>지금 코드</TableHead>
        <TableHead v-if="showChangeType" class="w-24">변경 종류</TableHead>
        <TableHead>판단 이유</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="spec in specs" :key="spec.specKey" class="align-top">
        <TableCell
          ><Badge variant="outline">{{ spec.reqKey }}</Badge></TableCell
        >
        <TableCell>{{ LOCATION_KIND_LABEL[spec.locationKind] }}</TableCell>
        <TableCell>
          <div class="font-mono text-xs">{{ place(spec) }}</div>
          <div v-if="spec.filePath && spec.symbol" class="text-muted-foreground font-mono text-xs">
            {{ spec.symbol }}
          </div>
        </TableCell>
        <TableCell class="max-w-72">
          <code v-if="spec.snippet" class="font-mono text-xs whitespace-pre-wrap break-all">{{
            spec.snippet
          }}</code>
          <span v-else class="text-muted-foreground text-xs">아직 없는 코드</span>
        </TableCell>
        <TableCell v-if="showChangeType">
          <Badge v-if="spec.changeType" variant="secondary">
            {{ CHANGE_TYPE_LABEL[spec.changeType] }}
          </Badge>
        </TableCell>
        <TableCell class="max-w-96 whitespace-normal break-keep">{{ spec.reason }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
