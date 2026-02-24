<script setup>
import { ContextMenuTrigger, useForwardProps } from "reka-ui";

const props = defineProps({
  disabled: { type: Boolean, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
});

const forwardedProps = useForwardProps(props);
</script>

<template>
  <ContextMenuTrigger data-slot="context-menu-trigger" v-bind="forwardedProps">
    <slot />
  </ContextMenuTrigger>
</template>
