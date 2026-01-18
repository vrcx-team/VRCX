<script setup>
import { cn } from "@/lib/utils";

const props = defineProps({
  class: { type: null, required: false },
});
</script>

<template>
  <div
    data-slot="item-header"
    :class="
      cn('flex basis-full items-center justify-between gap-2', props.class)
    "
  >
    <slot />
  </div>
</template>
