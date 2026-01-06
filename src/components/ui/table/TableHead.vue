<script setup>
    import { cn } from '@/lib/utils';

    const props = defineProps({
        class: { type: null, required: false }
    });
</script>

<template>
    <th
        data-slot="table-head"
        :class="
            cn(
                'text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap in-[.is-compact-table]:h-8! in-[.is-compact-table]:px-2.5! [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5',
                props.class
            )
        ">
        <slot />
    </th>
</template>
