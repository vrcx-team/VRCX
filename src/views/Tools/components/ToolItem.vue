<script setup>
    import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';

    defineProps({
        icon: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true }
    });
</script>

<template>
    <Item variant="outline" class="group cursor-pointer hover:bg-accent/50">
        <ItemMedia variant="icon" class="bg-transparent border-0">
            <i :class="[icon, 'inline-flex items-center justify-center text-2xl']" />
        </ItemMedia>
        <ItemContent>
            <div class="flex items-start gap-2">
                <ItemTitle class="flex-1">{{ title }}</ItemTitle>
                <slot name="actions" />
            </div>
            <ItemDescription>{{ description }}</ItemDescription>
        </ItemContent>
    </Item>
</template>
