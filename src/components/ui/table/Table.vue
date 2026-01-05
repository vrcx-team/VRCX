<script setup>
    import { cn } from '@/lib/utils';

    const props = defineProps({
        class: { type: null, required: false }
    });
</script>

<template>
    <div data-slot="table-container" class="relative w-full overflow-auto">
        <table data-slot="table" :class="cn('w-full caption-bottom text-sm', props.class)">
            <slot />
        </table>
    </div>
</template>
