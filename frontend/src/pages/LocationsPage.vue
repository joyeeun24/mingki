<script setup lang="ts">
import { SearchIcon } from '@lucide/vue'
import { computed } from 'vue'

import { getChangeSpecs } from '@/api/tasks'
import ChangeSpecTable from '@/components/domain/ChangeSpecTable.vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTaskResource } from '@/composables/useTaskResource'

const { data } = useTaskResource(getChangeSpecs)

const found = computed(
  () => (data.value?.targets.length ?? 0) + (data.value?.nonTargets.length ?? 0),
)
</script>

<template>
  <Skeleton v-if="!data" class="h-64 w-full" aria-busy="true" />

  <Empty v-else-if="found === 0" class="border">
    <EmptyHeader>
      <EmptyMedia variant="icon"><SearchIcon /></EmptyMedia>
      <EmptyTitle>아직 영향 위치가 없습니다</EmptyTitle>
      <EmptyDescription class="break-keep">
        요건을 확정하면 코드 · 설정 · 상품 규칙에서 고칠 곳을 찾습니다.
      </EmptyDescription>
    </EmptyHeader>
  </Empty>

  <Tabs v-else default-value="targets">
    <TabsList>
      <TabsTrigger value="targets">
        바꿀 곳 <Badge variant="secondary">{{ data.targets.length }}</Badge>
      </TabsTrigger>
      <TabsTrigger value="non-targets">
        대상 아님 <Badge variant="secondary">{{ data.nonTargets.length }}</Badge>
      </TabsTrigger>
    </TabsList>
    <TabsContent value="targets">
      <Card>
        <CardContent>
          <ChangeSpecTable :specs="data.targets" show-change-type />
        </CardContent>
      </Card>
    </TabsContent>
    <TabsContent value="non-targets">
      <p class="text-muted-foreground mb-2 text-sm break-keep">
        같은 숫자라도 의미가 다른 곳입니다. 고치지 않는 이유를 함께 남깁니다.
      </p>
      <Card>
        <CardContent>
          <ChangeSpecTable :specs="data.nonTargets" :show-change-type="false" />
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
</template>
