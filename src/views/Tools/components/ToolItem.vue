<script setup>
    import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';

    defineProps({
        icon: { type: [Object, Function], required: true },
        title: { type: String, required: true },
        description: { type: String, required: true }
    });
</script>

<template>
    <Item variant="outline" class="cursor-pointer hover:bg-accent/50">
        <ItemMedia variant="icon">
            <component :is="icon" />
        </ItemMedia>
        <ItemContent>
            <ItemTitle>{{ title }}</ItemTitle>
            <ItemDescription>{{ description }}</ItemDescription>
        </ItemContent>
    </Item>
</template>
