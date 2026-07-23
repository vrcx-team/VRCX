<script setup>
    import { cn } from '@/lib/utils';

    const props = defineProps({
        class: { type: null, required: false }
    });
</script>

<template>
    <div
        :class="
            cn(
                'relative [&>[data-slot=input]]:has-[[data-slot=increment]]:pe-5 [&>[data-slot=input]]:has-[[data-slot=decrement]]:ps-5',
                props.class
            )
        ">
        <slot />
    </div>
</template>
