<script setup>
import { DropdownMenuGroup } from "reka-ui";

const props = defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
});
</script>

<template>
  <DropdownMenuGroup data-slot="dropdown-menu-group" v-bind="props">
    <slot />
  </DropdownMenuGroup>
</template>
