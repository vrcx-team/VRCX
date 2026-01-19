<script setup>
import { cn } from "@/lib/utils";
import { itemMediaVariants } from ".";

const props = defineProps({
  class: { type: null, required: false },
  variant: { type: null, required: false },
});
</script>

<template>
  <div
    data-slot="item-media"
    :data-variant="props.variant"
    :class="cn(itemMediaVariants({ variant }), props.class)"
  >
    <slot />
  </div>
</template>
