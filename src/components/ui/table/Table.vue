<script setup>
    import { cn } from '@/lib/utils';

    const props = defineProps({
        class: { type: null, required: false },
        style: { type: [String, Array, Object], required: false }
    });
</script>

<template>
    <div data-slot="table-container" class="relative w-full">
        <table
            data-slot="table"
            :class="cn('w-full caption-bottom text-[13px] in-[.is-compact-table]:text-[12px]', props.class)"
            :style="props.style">
            <slot />
        </table>
    </div>
</template>
