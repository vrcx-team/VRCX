<script setup>
    import { cn } from '@/lib/utils';

    const props = defineProps({
        class: { type: null, required: false }
    });
</script>

<template>
    <td
        data-slot="table-cell"
        :class="
            cn(
                'p-2 align-middle whitespace-nowrap in-[.is-compact-table]:py-1! in-[.is-comfortable-table]:py-1.5! [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5',
                props.class
            )
        ">
        <slot />
    </td>
</template>
