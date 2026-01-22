<script setup>
    import { cn } from '@/lib/utils';

    defineProps({
        class: { type: null, required: false }
    });
</script>

<template>
    <p
        data-slot="empty-description"
        :class="
            cn(
                'text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4',
                $attrs.class ?? ''
            )
        ">
        <slot />
    </p>
</template>
