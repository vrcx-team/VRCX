<template>
    <div class="flex shrink-0 items-center justify-between border-b px-2.5 py-1.5">
        <div
            class="group flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            @click="navigateToPage">
            <i :class="icon" class="text-sm"></i>
            <span>{{ title }}</span>
            <ExternalLink class="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
    </div>
</template>

<script setup>
    import { ExternalLink } from 'lucide-vue-next';
    import { useRouter } from 'vue-router';

    const props = defineProps({
        title: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            default: ''
        },
        routeName: {
            type: String,
            default: ''
        }
    });

    const router = useRouter();

    function navigateToPage() {
        if (props.routeName) {
            router.push({ name: props.routeName });
        }
    }
</script>
