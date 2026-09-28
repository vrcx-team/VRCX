<template>
    <component
        :is="toggle ? 'label' : 'div'"
        class="-mx-2 flex min-h-8 items-center justify-between gap-6 rounded-md p-2 transition-colors has-[[data-slot=switch]:disabled]:cursor-not-allowed"
        :class="{ 'cursor-pointer hover:bg-accent': toggle }">
        <div class="flex flex-col gap-0.5 min-w-0 flex-1">
            <span class="text-sm leading-snug text-foreground">{{ label }}</span>
            <span v-if="description" class="text-xs leading-tight text-muted-foreground">{{ description }}</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
            <slot />
        </div>
    </component>
</template>

<script setup>
    defineProps({
        label: { type: String, required: true },
        description: { type: String, default: '' },
        toggle: { type: Boolean, default: false }
    });
</script>
