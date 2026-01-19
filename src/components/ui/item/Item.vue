<script setup>
import { Primitive } from "reka-ui";
import { cn } from "@/lib/utils";
import { itemVariants } from ".";

const props = defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false, default: "div" },
  class: { type: null, required: false },
  variant: { type: null, required: false },
  size: { type: null, required: false },
});
</script>

<template>
  <Primitive
    data-slot="item"
    :as="as"
    :as-child="asChild"
    :class="cn(itemVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
