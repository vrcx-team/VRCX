<script setup>
import { DropdownMenuRoot, useForwardPropsEmits } from "reka-ui";

const props = defineProps({
  defaultOpen: { type: Boolean, required: false },
  open: { type: Boolean, required: false },
  dir: { type: String, required: false },
  modal: { type: Boolean, required: false },
});
const emits = defineEmits(["update:open"]);

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DropdownMenuRoot
    v-slot="slotProps"
    data-slot="dropdown-menu"
    v-bind="forwarded"
  >
    <slot v-bind="slotProps" />
  </DropdownMenuRoot>
</template>
