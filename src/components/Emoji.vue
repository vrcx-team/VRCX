<template>
    <div ref="containerRef" class="relative overflow-hidden" :style="sizeStyle">
        <div
            v-if="image.frames"
            class="avatar absolute top-0 left-0"
            :style="
                generateEmojiStyle(imageUrl, image.framesOverTime, image.frames, image.loopStyle, effectiveSize)
            "></div>
        <Avatar v-else class="rounded w-full h-full">
            <AvatarImage :src="imageUrl" class="object-cover" />
            <AvatarFallback class="rounded">
                <Image class="size-4 text-muted-foreground" />
            </AvatarFallback>
        </Avatar>
    </div>
</template>

<script setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { useResizeObserver } from '@vueuse/core';
    import { Image } from 'lucide-vue-next';

    import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
    import { extractFileId, generateEmojiStyle } from '../shared/utils';
    import { useGalleryStore } from '../stores';

    const { getCachedEmoji } = useGalleryStore();
    const { emojiTable } = useGalleryStore();

    const props = defineProps({
        imageUrl: { type: String, default: '' },
        size: { type: Number, default: 0 }
    });

    const containerRef = ref(null);
    const observedWidth = ref(0);

    useResizeObserver(containerRef, (entries) => {
        const entry = entries[0];
        if (entry) {
            observedWidth.value = entry.contentRect.width;
        }
    });

    const effectiveSize = computed(() => {
        if (props.size > 0) {
            return props.size;
        }
        return observedWidth.value;
    });

    const sizeStyle = computed(() => {
        if (props.size > 0) {
            return { width: props.size + 'px', height: props.size + 'px' };
        }
        return {};
    });

    const image = ref({
        frames: null,
        framesOverTime: null,
        loopStyle: null,
        versions: []
    });

    async function update() {
        const fileId = extractFileId(props.imageUrl);
        for (const emoji of emojiTable) {
            if (emoji.id === fileId) {
                image.value = emoji;
                return;
            }
        }
        if (!fileId) return;
        image.value = await getCachedEmoji(fileId);
    }

    watch(() => props.imageUrl, update);

    onMounted(() => {
        update();
    });
</script>
