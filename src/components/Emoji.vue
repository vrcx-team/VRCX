<template>
    <div style="overflow: hidden" :style="{ width: size + 'px', height: size + 'px' }">
        <div
            v-if="image.frames"
            class="avatar"
            :style="generateEmojiStyle(imageUrl, image.framesOverTime, image.frames, image.loopStyle, size)"></div>
        <Avatar v-else class="rounded" :style="{ width: size + 'px', height: size + 'px' }">
            <AvatarImage :src="imageUrl" class="object-cover" />
            <AvatarFallback class="rounded">
                <ImageOff class="size-4 text-muted-foreground" />
            </AvatarFallback>
        </Avatar>
    </div>
</template>

<script setup>
    import { onMounted, ref, watch } from 'vue';
    import { ImageOff } from 'lucide-vue-next';

    import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
    import { extractFileId, generateEmojiStyle } from '../shared/utils';
    import { useGalleryStore } from '../stores';

    const { getCachedEmoji } = useGalleryStore();
    const { emojiTable } = useGalleryStore();

    const props = defineProps({
        imageUrl: { type: String, default: '' },
        size: { type: Number, default: 100 }
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
