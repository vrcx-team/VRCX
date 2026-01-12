<script setup>
    import { cn } from '@/lib/utils';

    const props = defineProps({
        class: { type: null, required: false }
    });
</script>

<template>
    <div
        data-slot="field-label"
        :class="
            cn(
                'flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50',
                props.class
            )
        ">
        <slot />
    </div>
</template>
