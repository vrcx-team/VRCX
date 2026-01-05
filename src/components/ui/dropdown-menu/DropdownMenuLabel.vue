<script setup>
import { reactiveOmit } from "@vueuse/core";
import { DropdownMenuLabel, useForwardProps } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false },
  inset: { type: Boolean, required: false },
});

const delegatedProps = reactiveOmit(props, "class", "inset");
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <DropdownMenuLabel
    data-slot="dropdown-menu-label"
    :data-inset="inset ? '' : undefined"
    v-bind="forwardedProps"
    :class="
      cn('px-2 py-1.5 text-sm font-medium data-[inset]:pl-8', props.class)
    "
  >
    <slot />
  </DropdownMenuLabel>
</template>
