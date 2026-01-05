<script setup>
import { SelectItemText } from "reka-ui";

const props = defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
});
</script>

<template>
  <SelectItemText data-slot="select-item-text" v-bind="props">
    <slot />
  </SelectItemText>
</template>
