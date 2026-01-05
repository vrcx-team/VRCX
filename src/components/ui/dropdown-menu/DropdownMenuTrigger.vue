<script setup>
import { DropdownMenuTrigger, useForwardProps } from "reka-ui";

const props = defineProps({
  disabled: { type: Boolean, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
});

const forwardedProps = useForwardProps(props);
</script>

<template>
  <DropdownMenuTrigger
    data-slot="dropdown-menu-trigger"
    v-bind="forwardedProps"
  >
    <slot />
  </DropdownMenuTrigger>
</template>
